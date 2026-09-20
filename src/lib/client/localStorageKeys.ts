export function tokenStorageKey(gameKey: string): string {
  return `luzhanqi:${gameKey.toUpperCase()}:token`;
}

export function saveToken(gameKey: string, token: string) {
  try {
    window.localStorage.setItem(tokenStorageKey(gameKey), token);
  } catch {
    // localStorage can throw in private/blocked contexts - the game still works, you just
    // won't be able to reconnect after a refresh.
  }
}

export function readToken(gameKey: string): string | null {
  try {
    return window.localStorage.getItem(tokenStorageKey(gameKey));
  } catch {
    return null;
  }
}
