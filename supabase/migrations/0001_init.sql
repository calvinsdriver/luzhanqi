-- Luzhanqi schema.
--
-- Design: every gameplay table (games, seats, pieces, moves) is RLS-locked with ZERO
-- grants to anon/authenticated - only the server's service-role client (which bypasses
-- RLS) ever touches them. The only table the browser's anon-key client can read is
-- game_events, a payload-free "something changed, go refetch the masked state" signal.
-- All hidden-information masking lives in one TypeScript function (src/lib/rules/view.ts),
-- not split across RLS policies, since there's no Supabase Auth/JWT here to filter by.

create extension if not exists pgcrypto;

create table games (
  id uuid primary key default gen_random_uuid(),
  short_key text not null unique,
  mode text not null check (mode in ('2p', '4p')),
  status text not null default 'lobby' check (status in ('lobby', 'setup', 'active', 'finished')),
  current_turn_seat int not null default 0,
  version int not null default 0,
  winner jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table seats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  seat_index int not null,
  nickname text not null,
  reconnect_token_hash text not null,
  team int not null,
  connected boolean not null default true,
  placement_confirmed boolean not null default false,
  flag_captured boolean not null default false,
  flag_revealed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_id, seat_index)
);

-- Case-insensitive nickname uniqueness within a game (the authoritative guard - a
-- client-side pre-check only exists for fast UX feedback, not for correctness).
create unique index seats_nickname_ci_unique_per_game on seats (game_id, lower(nickname));

create table pieces (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  seat_index int not null,
  piece_type text not null,
  node_id text,
  status text not null default 'in_play' check (status in ('in_play', 'captured')),
  revealed boolean not null default false,
  immobilized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pieces_game_id_idx on pieces (game_id);

create table moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  seq int not null,
  seat_index int not null,
  from_node text not null,
  to_node text not null,
  result text not null,
  revealed_types jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (game_id, seq)
);

-- The only client-readable table: no gameplay payload, just "something changed".
create table game_events (
  id bigint generated always as identity primary key,
  game_id uuid not null references games (id) on delete cascade,
  seq int not null,
  created_at timestamptz not null default now()
);

create index game_events_game_id_idx on game_events (game_id);

alter table games enable row level security;
alter table seats enable row level security;
alter table pieces enable row level security;
alter table moves enable row level security;
alter table game_events enable row level security;

-- No policies at all on games/seats/pieces/moves -> default-deny for anon/authenticated.
-- Only game_events gets a read policy, scoped by game_id, carrying no gameplay data.
create policy game_events_select_all on game_events for select using (true);

-- ---------------------------------------------------------------------------------------
-- join_game: atomically assigns the next open seat, enforcing nickname uniqueness and the
-- seat cap for the game's mode. Locks the game row for the duration of the transaction so
-- two simultaneous joins can't race for the same seat.
-- ---------------------------------------------------------------------------------------
create or replace function join_game(
  p_game_id uuid,
  p_nickname text,
  p_reconnect_token_hash text
) returns table (seat_index int, team int)
language plpgsql
as $$
declare
  v_mode text;
  v_status text;
  v_max_seats int;
  v_taken int;
  v_seat int;
begin
  select mode, status into v_mode, v_status from games where id = p_game_id for update;
  if v_mode is null then
    raise exception 'game_not_found';
  end if;
  if v_status <> 'lobby' then
    raise exception 'game_not_joinable';
  end if;

  v_max_seats := case when v_mode = '2p' then 2 else 4 end;

  select count(*) into v_taken from seats where game_id = p_game_id;
  if v_taken >= v_max_seats then
    raise exception 'game_full';
  end if;

  if exists (
    select 1 from seats where game_id = p_game_id and lower(nickname) = lower(p_nickname)
  ) then
    raise exception 'nickname_taken';
  end if;

  v_seat := v_taken;

  insert into seats (game_id, seat_index, nickname, reconnect_token_hash, team, connected, placement_confirmed)
  values (p_game_id, v_seat, p_nickname, p_reconnect_token_hash, v_seat % 2, true, false);

  if v_seat + 1 = v_max_seats then
    update games set status = 'setup', version = version + 1, updated_at = now() where id = p_game_id;
  end if;

  insert into game_events (game_id, seq)
  select p_game_id, coalesce(max(seq), 0) + 1 from game_events where game_id = p_game_id;

  return query select v_seat, v_seat % 2;
end;
$$;

-- ---------------------------------------------------------------------------------------
-- confirm_placement: stores one seat's validated 25-piece placement (the caller has
-- already run src/lib/rules/placement.ts's validatePlacement before calling this) and,
-- once every seat has confirmed, flips the game to 'active'.
-- ---------------------------------------------------------------------------------------
create or replace function confirm_placement(
  p_game_id uuid,
  p_seat_index int,
  p_pieces jsonb
) returns void
language plpgsql
as $$
declare
  v_status text;
  v_mode text;
  v_seat_count int;
  v_confirmed_count int;
begin
  select status, mode into v_status, v_mode from games where id = p_game_id for update;
  if v_status is null then
    raise exception 'game_not_found';
  end if;
  if v_status <> 'setup' then
    raise exception 'game_not_in_setup';
  end if;

  delete from pieces where game_id = p_game_id and seat_index = p_seat_index;

  insert into pieces (game_id, seat_index, piece_type, node_id)
  select p_game_id, p_seat_index, entry->>'pieceType', entry->>'nodeId'
  from jsonb_array_elements(p_pieces) as entry;

  update seats set placement_confirmed = true
  where game_id = p_game_id and seat_index = p_seat_index;

  v_seat_count := case when v_mode = '2p' then 2 else 4 end;
  select count(*) into v_confirmed_count
  from seats where game_id = p_game_id and placement_confirmed;

  if v_confirmed_count = v_seat_count then
    update games
    set status = 'active', current_turn_seat = 0, version = version + 1, updated_at = now()
    where id = p_game_id;
  end if;

  insert into game_events (game_id, seq)
  select p_game_id, coalesce(max(seq), 0) + 1 from game_events where game_id = p_game_id;
end;
$$;

-- ---------------------------------------------------------------------------------------
-- apply_move_diff: persists one move's already-computed diff (from src/lib/rules/applyMove
-- .ts) in a single transaction, gated by optimistic-concurrency version + turn ownership.
-- Returns false (no-op) if the game moved on since the caller read it, so it can refetch
-- and retry instead of corrupting state.
-- ---------------------------------------------------------------------------------------
create or replace function apply_move_diff(
  p_game_id uuid,
  p_expected_version int,
  p_seat_index int,
  p_next_status text,
  p_next_turn_seat int,
  p_winner jsonb,
  p_seat_updates jsonb,
  p_piece_updates jsonb,
  p_move jsonb
) returns boolean
language plpgsql
as $$
declare
  v_updated int;
begin
  update games
  set status = p_next_status,
      current_turn_seat = p_next_turn_seat,
      winner = p_winner,
      version = version + 1,
      updated_at = now()
  where id = p_game_id
    and version = p_expected_version
    and current_turn_seat = p_seat_index
    and status = 'active';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  update seats s
  set flag_captured = (u->>'flag_captured')::boolean,
      flag_revealed = (u->>'flag_revealed')::boolean
  from jsonb_array_elements(p_seat_updates) as u
  where s.game_id = p_game_id and s.seat_index = (u->>'seat_index')::int;

  update pieces pc
  set node_id = u->>'node_id',
      status = u->>'status',
      revealed = (u->>'revealed')::boolean,
      immobilized = (u->>'immobilized')::boolean,
      updated_at = now()
  from jsonb_array_elements(p_piece_updates) as u
  where pc.game_id = p_game_id and pc.id = (u->>'id')::uuid;

  insert into moves (game_id, seq, seat_index, from_node, to_node, result, revealed_types)
  values (
    p_game_id,
    (p_move->>'seq')::int,
    (p_move->>'seat_index')::int,
    p_move->>'from_node',
    p_move->>'to_node',
    p_move->>'result',
    p_move->'revealed_types'
  );

  insert into game_events (game_id, seq) values (p_game_id, (p_move->>'seq')::int);

  return true;
end;
$$;
