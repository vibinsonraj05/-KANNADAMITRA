"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { readRecords, writeRecords, type TranslationRecord } from "@/lib/translation-storage";
import Icon from "@/components/Icon";
import Speak from "@/components/Speak";

export default function TranslationLibrary({ kind, mode = "page", onClose, onReuse }: { kind: "history" | "saved"; mode?: "page" | "drawer"; onClose?: () => void; onReuse?: (item: TranslationRecord) => void }) {
  const router = useRouter();
  const key = kind === "history" ? "kannadamitra-history" : "kannadamitra-saved";
  const [items, setItems] = useState<TranslationRecord[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "text" | "voice" | "camera">("all");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const local = kind === "history" ? readRecords(key) : readRecords(key); setItems(local);
    if (kind !== "history") return;
    let cancelled = false;
    const sync = async () => {
      try {
        if (local.length) await fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: local.slice(0, 100) }) });
        const response = await fetch("/api/history"); const data = await response.json(); if (!response.ok) throw new Error(data.message || "History sync failed.");
        if (!cancelled && Array.isArray(data.items)) { const merged = new Map<string, TranslationRecord>(); for (const item of [...data.items, ...local]) if (item?.id) merged.set(item.id, item); const next = [...merged.values()].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,500); setItems(next); writeRecords(key, next.slice(0,100)); }
      } catch (error) { if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not reach Atlas history."); }
    };
    void sync(); return () => { cancelled = true; };
  }, [key, kind]);
  const filtered = useMemo(() => items.filter(item => (kind === "saved" || filter === "all" || item.kind === filter) && `${item.source} ${item.kannada} ${item.roman} ${item.meaning} ${item.sourceLanguage}`.toLowerCase().includes(query.toLowerCase())), [items, query, filter, kind]);
  const update = (next: TranslationRecord[]) => { setItems(next); if (!writeRecords(key, next)) setMessage("Could not update browser storage."); };
  const reopen = (item: TranslationRecord) => { if (onReuse) { onReuse(item); return; } try { localStorage.setItem("kannadamitra-reopen", JSON.stringify(item)); router.push("/translate"); } catch { setMessage("Could not reopen this translation."); } };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setMessage("Copied to clipboard."); } catch { setMessage("Clipboard access is unavailable. Select and copy the text."); } };
  const remove = (id: string) => { const next = items.filter(item => item.id !== id); if (kind === "history") void fetch("/api/history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).then(response => { if (!response.ok) setMessage("Could not remove this entry from Atlas."); }); update(next); };
  return <div className={`library-page ${mode === "drawer" ? "history-drawer-content" : ""}`}><div className="library-title"><div><div className="eyebrow">{mode === "drawer" ? "YOUR JOURNEY" : "YOUR TRANSLATIONS"}</div><h1 id={mode === "drawer" ? "history-drawer-title" : undefined}>{mode === "drawer" ? "Translation History" : kind === "history" ? "History" : "Saved translations"}</h1><p className="subhead">{mode === "drawer" ? "Your language journey, all in one place." : kind === "history" ? "Synced to your account in MongoDB Atlas." : "Useful phrases you’ve kept on this device."}</p></div><div className="history-heading-actions">{kind === "history" && items.length > 0 && mode !== "drawer" && <button className="btn ghost small" onClick={() => { if (confirm("Clear your translation history from MongoDB Atlas and this browser?")) { void fetch("/api/history", { method: "DELETE" }).then(response => { if (!response.ok) setMessage("Could not clear Atlas history."); }); update([]); } }}>Clear history</button>}{mode === "drawer" && <button className="history-drawer-close" type="button" onClick={onClose} aria-label="Close translation history"><Icon name="close"/></button>}</div></div><label className="library-search"><span className="sr-only">Search translations</span><Icon name="search"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your translations" type="search"/></label>{kind === "history" && <div className="history-filters" role="group" aria-label="Filter translation history">{(["all","text","voice","camera"] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All" : value[0].toUpperCase()+value.slice(1)}</button>)}</div>}{message && <p role="status" className="inline-notice">{message}</p>}{filtered.length === 0 ? <div className="library-empty"><span aria-hidden="true">{kind === "history" ? <Icon name="history"/> : <Icon name="bookmark"/>}</span><p>{query || filter !== "all" ? "No translations match this search or filter." : kind === "history" ? "Your translation history will appear here." : "Save a translation and it will appear here."}</p></div> : <div className="library-list">{filtered.map(item => <article className="library-item" key={item.id}><button className="library-open" onClick={() => reopen(item)} aria-label={`Reuse this translation: ${item.kannada}`}><div className="library-meta">{item.kind[0].toUpperCase()+item.kind.slice(1)} · {item.sourceLanguage} → Kannada · {new Date(item.createdAt).toLocaleString()}</div><div className="library-kannada" lang="kn">{item.kannada}</div>{item.roman && <div className="result-roman-small">{item.roman}</div>}<p>{item.source || item.meaning}</p></button><div className="library-actions"><button className="btn ghost small" onClick={() => void copy(item.kannada)}><Icon name="copy"/> Copy</button><Speak text={item.kannada} pronunciation={item.roman} label="Listen to this Kannada translation"/>{item.roman && <button className="btn ghost small" onClick={() => void copy(item.roman)}><Icon name="copy"/> Pronunciation</button>}{mode !== "drawer" && <button className="library-delete" onClick={() => remove(item.id)} aria-label="Delete translation"><Icon name="delete"/> Delete</button>}</div></article>)}</div>}</div>;
}
