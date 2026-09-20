import "server-only";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

/** A fresh reconnect token: shown to the client once, stored only as a hash server-side. */
export function generateReconnectToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatchesHash(token: string, hash: string): boolean {
  const candidate = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
