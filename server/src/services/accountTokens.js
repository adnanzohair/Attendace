import { createHash, randomBytes } from "node:crypto";

export const hashAccountToken = (rawToken) => createHash("sha256").update(String(rawToken)).digest("hex");

export function createAccountToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashAccountToken(rawToken) };
}
