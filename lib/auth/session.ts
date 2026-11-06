import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cookieName = "kannadamitra-session";
let secretValue: Promise<string> | null = null;

async function secret(): Promise<string> {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32) {
    return process.env.AUTH_SECRET;
  }
  secretValue ??= (async () => {
    const dataDir = join(process.cwd(), "data");
    const secretFile = join(dataDir, ".session_secret");

    try {
      if (existsSync(secretFile)) {
        const cached = readFileSync(secretFile, "utf-8").trim();
        if (cached.length >= 32) return cached;
      }
    } catch {}

    try {
      const db = await Promise.race([
        getDb(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 2500))
      ]);
      const settings = db.collection<{ _id: string; value?: string }>("app_settings");
      const value = randomBytes(48).toString("base64url");
      await settings.updateOne({ _id: "session_secret" }, { $setOnInsert: { value } }, { upsert: true });
      const saved = await settings.findOne({ _id: "session_secret" });
      if (typeof saved?.value === "string") {
        try {
          if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
          writeFileSync(secretFile, saved.value, "utf-8");
        } catch {}
        return saved.value;
      }
    } catch {
      // Atlas unavailable, create local secret
    }

    const localValue = randomBytes(48).toString("base64url");
    try {
      if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
      writeFileSync(secretFile, localValue, "utf-8");
    } catch {}
    return localValue;
  })();
  return secretValue;
}

async function sign(value: string) {
  return createHmac("sha256", await secret()).update(value).digest("base64url");
}

export async function createSession(account: { id: string; name: string; email: string }) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: account.id,
      name: account.name,
      email: account.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    })
  ).toString("base64url");
  const input = `v1.${payload}`;
  const token = `${input}.${await sign(input)}`;
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  try {
    const token = (await cookies()).get(cookieName)?.value;
    if (!token) return null;
    const [version, encoded, signature] = token.split(".");
    if (version !== "v1" || !encoded || !signature) return null;
    const input = `${version}.${encoded}`;
    const expected = Buffer.from(await sign(input));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now() / 1000
    )
      return null;
    return { id: payload.sub, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
