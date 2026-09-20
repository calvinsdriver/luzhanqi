import "server-only";
import { randomInt } from "node:crypto";

// Crockford base32 alphabet minus visually ambiguous characters (0/O, 1/I/L) is already
// excluded by Crockford's own alphabet design; this is exactly that alphabet.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const KEY_LENGTH = 6;

/** A short, shareable game key. Collisions are handled by the caller via unique-constraint retry. */
export function generateShortKey(): string {
  let key = "";
  for (let i = 0; i < KEY_LENGTH; i++) {
    key += ALPHABET[randomInt(ALPHABET.length)];
  }
  return key;
}
