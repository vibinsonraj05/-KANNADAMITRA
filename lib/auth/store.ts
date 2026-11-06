import "server-only";
import { getDb } from "@/lib/db";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Account = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const collectionName = "accounts";
const dataDir = join(process.cwd(), "data");
const localAccountsFile = join(dataDir, "accounts.json");

const SEED_ACCOUNTS: Account[] = [
  {
    id: "demo-user-kannadamitra",
    name: "Demo Learner",
    email: "demo@kannadamitra.com",
    passwordHash: "scrypt$yTKZOvfbz9hw-j0GSR3ptQ$DnRkrvt9H6stItO3YG214c6SISdMcqJJ3qLA7IGpSx7EcfjM2o3GtzK6oaSoIqIp59DK3X1nymRkswFEMDzFiw",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
];

function readLocalAccounts(): Account[] {
  try {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    if (!existsSync(localAccountsFile)) {
      writeFileSync(localAccountsFile, JSON.stringify(SEED_ACCOUNTS, null, 2), "utf-8");
      return [...SEED_ACCOUNTS];
    }
    const content = readFileSync(localAccountsFile, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Ensure seed demo user is present
      const hasDemo = parsed.some(acc => acc.email === "demo@kannadamitra.com");
      if (!hasDemo) {
        parsed.push(...SEED_ACCOUNTS);
        writeFileSync(localAccountsFile, JSON.stringify(parsed, null, 2), "utf-8");
      }
      return parsed;
    }
    return [...SEED_ACCOUNTS];
  } catch (error) {
    console.error("Failed to read local accounts", error);
    return [...SEED_ACCOUNTS];
  }
}

function writeLocalAccount(account: Account): void {
  try {
    const list = readLocalAccounts();
    const existingIndex = list.findIndex(acc => acc.email.toLowerCase() === account.email.toLowerCase());
    if (existingIndex >= 0) {
      list[existingIndex] = account;
    } else {
      list.push(account);
    }
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    writeFileSync(localAccountsFile, JSON.stringify(list, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write local account", error);
  }
}

let indexes: Promise<unknown> | null = null;
async function accounts() {
  const db = await getDb();
  indexes ??= db.collection(collectionName).createIndex({ email: 1 }, { unique: true, name: "email_unique" });
  await indexes;
  return db.collection<Account>(collectionName);
}

export async function findAccount(email: string): Promise<Account | null> {
  const normalized = email.trim().toLowerCase();

  // Try Atlas first
  try {
    const collection = await Promise.race([
      accounts(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Atlas DB connection timeout")), 2500))
    ]);
    const found = await collection.findOne({ email: normalized });
    if (found) {
      writeLocalAccount(found);
      return found;
    }
  } catch (error) {
    // Atlas offline / network failure - fall through to local storage
  }

  // Fallback to local accounts
  const localList = readLocalAccounts();
  const matched = localList.find(acc => acc.email.toLowerCase() === normalized);
  return matched || null;
}

export async function createAccount(account: Account): Promise<boolean> {
  const normalized = account.email.trim().toLowerCase();
  account.email = normalized;

  // Check if already in local accounts
  const localList = readLocalAccounts();
  if (localList.some(acc => acc.email.toLowerCase() === normalized)) {
    return false;
  }

  // Try Atlas
  try {
    const collection = await Promise.race([
      accounts(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Atlas DB connection timeout")), 2500))
    ]);
    await collection.insertOne(account);
    writeLocalAccount(account);
    return true;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return false;
    }
    console.warn("MongoDB Atlas unreachable, saving account to local store:", error instanceof Error ? error.message : error);
    writeLocalAccount(account);
    return true;
  }
}
