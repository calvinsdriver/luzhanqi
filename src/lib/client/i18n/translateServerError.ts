import type { TranslationKey } from "./translations";

// The API returns plain English error strings (see src/lib/server/gameRepo.ts and the
// route handlers) since the server has no notion of the viewer's display language. This
// is a small, exact-match lookup against the fixed set of messages our own code actually
// returns - anything unrecognized (which shouldn't happen, but might if the server changes
// without this list being updated) is shown as-is rather than hidden.
const KNOWN_MESSAGES: Record<string, TranslationKey> = {
  "Could not create the game": "error.couldNotCreate",
  "Could not join that game": "error.couldNotJoin",
  "Could not confirm placement": "error.couldNotConfirm",
  "Move failed": "error.moveFailed",
  "Not connected": "error.notConnected",
  "That nickname is taken in this game": "error.nicknameTaken",
  "This game is already full": "error.gameFull",
  "This game has already started": "error.gameAlreadyStarted",
  "Game not found": "error.gameNotFound",
  "Invalid reconnect token": "error.invalidToken",
  "This game is not in the placement phase": "error.notInSetupPhase",
  "Someone else already moved - refresh and try again": "error.someoneElseAlreadyMoved",
  "Something went wrong": "error.somethingWentWrong",
  "It is not your turn": "error.notYourTurn",
  "Illegal move": "error.illegalMove",
  "No piece of yours at that node": "error.noPieceAtNode",
  "That piece is immobilized in a headquarters": "error.immobilized",
  "Game is not active": "error.gameNotActive",
};

export function translateServerError(message: string, t: (key: TranslationKey) => string): string {
  const key = KNOWN_MESSAGES[message];
  return key ? t(key) : message;
}
