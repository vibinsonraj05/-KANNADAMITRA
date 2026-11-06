import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import type { TranslationRecord } from "@/lib/translation-storage";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";

const dataDir = join(process.cwd(), "data");
const localHistoryFile = join(dataDir, "history.json");

type AccountHistoryEntry = TranslationRecord & { accountId: string };

function readLocalHistory(accountId: string): TranslationRecord[] {
  try {
    if (!existsSync(localHistoryFile)) return [];
    const content = readFileSync(localHistoryFile, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((entry: AccountHistoryEntry) => entry.accountId === accountId)
        .map(({ accountId: _accId, ...record }: AccountHistoryEntry) => record);
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalHistory(records: TranslationRecord[], accountId: string) {
  try {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    let all: AccountHistoryEntry[] = [];
    if (existsSync(localHistoryFile)) {
      try {
        const parsed = JSON.parse(readFileSync(localHistoryFile, "utf-8"));
        if (Array.isArray(parsed)) all = parsed;
      } catch {}
    }
    // Upsert records
    for (const record of records) {
      const idx = all.findIndex(e => e.accountId === accountId && e.id === record.id);
      if (idx >= 0) {
        all[idx] = { ...record, accountId };
      } else {
        all.unshift({ ...record, accountId });
      }
    }
    // Limit to 500 total
    writeFileSync(localHistoryFile, JSON.stringify(all.slice(0, 500), null, 2), "utf-8");
  } catch (error) {
    console.error("Local history write failed", error);
  }
}

function deleteLocalHistory(accountId: string, recordId?: string) {
  try {
    if (!existsSync(localHistoryFile)) return;
    const parsed = JSON.parse(readFileSync(localHistoryFile, "utf-8"));
    if (Array.isArray(parsed)) {
      const filtered = recordId
        ? parsed.filter(e => !(e.accountId === accountId && e.id === recordId))
        : parsed.filter(e => e.accountId !== accountId);
      writeFileSync(localHistoryFile, JSON.stringify(filtered, null, 2), "utf-8");
    }
  } catch {}
}

function validRecord(value: unknown): value is TranslationRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TranslationRecord>;
  return (
    typeof item.id === "string" &&
    item.id.length <= 100 &&
    (item.kind === "text" || item.kind === "voice" || item.kind === "camera") &&
    typeof item.source === "string" &&
    item.source.length <= 12_000 &&
    typeof item.sourceLanguage === "string" &&
    item.sourceLanguage.length <= 80 &&
    item.target === "Kannada" &&
    typeof item.kannada === "string" &&
    item.kannada.length <= 20_000 &&
    typeof item.roman === "string" &&
    item.roman.length <= 20_000 &&
    typeof item.meaning === "string" &&
    item.meaning.length <= 20_000 &&
    (item.tone === "formal" || item.tone === "casual") &&
    (item.style === "natural" || item.style === "literal") &&
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt))
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in to view your translation history." }, { status: 401 });

  try {
    const db = await Promise.race([
      getDb(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Atlas DB connection timeout")), 2500))
    ]);
    const items = await db
      .collection("translation_history")
      .find({ accountId: session.id }, { projection: { _id: 0, accountId: 0 } })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    // Cache locally
    if (items.length) {
      saveLocalHistory(items as unknown as TranslationRecord[], session.id);
    }
    return NextResponse.json({ items });
  } catch {
    // Atlas unavailable - serve local history
    const local = readLocalHistory(session.id);
    return NextResponse.json({ items: local });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in to save translation history." }, { status: 401 });

  try {
    const body = await request.json();
    const entries: unknown[] = Array.isArray(body.records) ? body.records : [body.record];
    if (entries.length < 1 || entries.length > 100 || entries.some(entry => !validRecord(entry))) {
      return NextResponse.json({ message: "Invalid translation history entry." }, { status: 400 });
    }

    const typedEntries = entries as TranslationRecord[];
    // Always persist to local store
    saveLocalHistory(typedEntries, session.id);

    // Also attempt Atlas
    try {
      const db = await Promise.race([
        getDb(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Atlas DB timeout")), 2500))
      ]);
      const collection = db.collection("translation_history");
      await collection.createIndex({ accountId: 1, id: 1 }, { unique: true, name: "account_record_unique" });
      await collection.bulkWrite(
        typedEntries.map(record => ({
          updateOne: {
            filter: { accountId: session.id, id: record.id },
            update: { $set: { ...record, accountId: session.id } },
            upsert: true,
          },
        }))
      );
    } catch {
      // Atlas sync silent fallback - local store already saved
    }

    return NextResponse.json({ ok: true, count: entries.length });
  } catch (error) {
    console.error("History save failed", error);
    return NextResponse.json({ message: "Could not save history." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sign in to manage translation history." }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const recordId = typeof body.id === "string" ? body.id : undefined;

    // Delete locally
    deleteLocalHistory(session.id, recordId);

    // Also delete in Atlas
    try {
      const db = await Promise.race([
        getDb(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Atlas DB timeout")), 2500))
      ]);
      const collection = db.collection("translation_history");
      if (recordId) {
        await collection.deleteOne({ accountId: session.id, id: recordId });
      } else {
        await collection.deleteMany({ accountId: session.id });
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("History delete failed", error);
    return NextResponse.json({ message: "Could not update history." }, { status: 500 });
  }
}
