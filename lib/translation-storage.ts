export type TranslationRecord = {
  id: string;
  kind: "text" | "voice" | "camera";
  source: string;
  sourceLanguage: string;
  target: "Kannada";
  kannada: string;
  roman: string;
  meaning: string;
  tone: "formal" | "casual";
  style: "natural" | "literal";
  createdAt: string;
};

export const HISTORY_KEY = "kannadamitra-history";
export const SAVED_KEY = "kannadamitra-saved";

export function readRecords(key: string): TranslationRecord[] {
  try {
    const legacySaved = key === SAVED_KEY ? localStorage.getItem("kfe-saved") : null;
    const value = JSON.parse(localStorage.getItem(key) || legacySaved || "[]");
    return Array.isArray(value) ? value.filter(item => item && typeof item.kannada === "string").map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `${Date.now()}-${index}`,
      kind: item.kind === "voice" || item.kind === "camera" ? item.kind : "text" as const,
      source: typeof item.source === "string" ? item.source : "",
      sourceLanguage: typeof item.sourceLanguage === "string" ? item.sourceLanguage : "English",
      target: "Kannada" as const,
      kannada: item.kannada,
      roman: typeof item.roman === "string" ? item.roman : "",
      meaning: typeof item.meaning === "string" ? item.meaning : "",
      tone: item.tone === "formal" ? "formal" as const : "casual" as const,
      style: item.style === "literal" ? "literal" as const : "natural" as const,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    })) : [];
  } catch { return []; }
}

export function writeRecords(key: string, records: TranslationRecord[]) {
  try { localStorage.setItem(key, JSON.stringify(records)); return true; }
  catch { return false; }
}

export function makeRecord(input: Omit<TranslationRecord, "id" | "createdAt" | "target">): TranslationRecord {
  return { ...input, target: "Kannada", id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() };
}
