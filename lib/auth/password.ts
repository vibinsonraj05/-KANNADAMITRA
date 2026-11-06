import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}
export async function verifyPassword(password: string, stored: string) {
  try {
    const [scheme, saltText, hashText] = stored.split("$");
    if (scheme !== "scrypt" || !saltText || !hashText) return false;
    const salt = Buffer.from(saltText, "base64url"), expected = Buffer.from(hashText, "base64url");
    const actual = await scrypt(password, salt, expected.length) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
