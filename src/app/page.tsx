import { CreateGameForm } from "@/components/home/CreateGameForm";
import { JoinGameForm } from "@/components/join/JoinGameForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <h1 className="mb-2 text-center font-heading text-3xl tracking-wide text-accent sm:text-4xl">
          LUZHANQI
        </h1>
        <p className="mb-8 text-center text-sm text-text-muted">
          Land Battle Chess, online. 2 or 4 players. Create a game and share the key, or
          join one you were given.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <CreateGameForm />
          <JoinGameForm />
        </div>
      </div>
    </div>
  );
}
