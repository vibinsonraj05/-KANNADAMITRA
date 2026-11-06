"use client";
import { useEffect, useRef, useState } from "react";
import Speak, { speak as speakKannada } from "@/components/Speak";
import Icon from "@/components/Icon";
import TranslationLibrary from "@/components/TranslationLibrary";
import { HISTORY_KEY, SAVED_KEY, makeRecord, readRecords, writeRecords, type TranslationRecord } from "@/lib/translation-storage";
import { sourceLanguages as languages } from "@/lib/languages";
import { getPreferredSourceLanguage, setPreferredSourceLanguage, subscribeToSourceLanguage } from "@/lib/source-language-preference";

type Output = Pick<TranslationRecord, "kannada" | "roman" | "meaning">;
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((event: RecognitionEvent) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type RecognitionConstructor = new () => Recognition;
declare global { interface Window { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor } }

export default function Translate() {
  const [sourceLabel, setSourceLabel] = useState("English");
  const [text, setText] = useState("");
  const [tone, setTone] = useState<"formal" | "casual">("casual");
  const [style, setStyle] = useState<"natural" | "literal">("natural");
  const [playbackSpeed, setPlaybackSpeed] = useState("normal");
  const [result, setResult] = useState<Output | null>(null);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [inputKind, setInputKind] = useState<"text" | "voice">("voice");
  const [saved, setSaved] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [copied, setCopied] = useState<"" | "kannada" | "roman">("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const historyButton = useRef<HTMLButtonElement | null>(null);
  const historyPanel = useRef<HTMLElement | null>(null);
  const source = languages.find(language => language.label === sourceLabel);
  const sourceValid = Boolean(source);

  useEffect(() => {
    const checkVoices = () => setVoiceAvailable(typeof window !== "undefined" && "speechSynthesis" in window);
    checkVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", checkVoices);
    const applySourceLanguage = (code: string) => setSourceLabel(languages.find(language => language.code === code)?.label || "English");
    applySourceLanguage(getPreferredSourceLanguage());
    const unsubscribeSourceLanguage = subscribeToSourceLanguage(applySourceLanguage);
    setTone(localStorage.getItem("kannadamitra-tone") === "formal" ? "formal" : "casual");
    setStyle(localStorage.getItem("kannadamitra-style") === "literal" ? "literal" : "natural");
    setPlaybackSpeed(localStorage.getItem("kannadamitra-speed") || "normal");
    const savedText = localStorage.getItem("kannadamitra-reopen");
    if (savedText) {
      try {
        const item = JSON.parse(savedText) as TranslationRecord;
        setSourceLabel(item.sourceLanguage); setText(item.source); setResult(item); setTone(item.tone); setStyle(item.style);
      } catch { /* Ignore an invalid local entry. */ }
      localStorage.removeItem("kannadamitra-reopen");
    }
    return () => { unsubscribeSourceLanguage(); window.speechSynthesis?.removeEventListener?.("voiceschanged", checkVoices); try { recognition.current?.abort(); } catch { /* Already stopped. */ } };
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = historyPanel.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])') || []);
    const focusFrame = window.requestAnimationFrame(() => (focusable()[0] || panel)?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setHistoryOpen(false); return; }
      if (event.key !== "Tab") return;
      const elements = focusable(); if (!elements.length) { event.preventDefault(); panel?.focus(); return; }
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { window.cancelAnimationFrame(focusFrame); document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; historyButton.current?.focus(); };
  }, [historyOpen]);

  const reuseFromHistory = (item: TranslationRecord) => {
    const language = languages.find(option => option.label === item.sourceLanguage);
    if (language) { setSourceLabel(language.label); setPreferredSourceLanguage(language.code); }
    setText(item.source); setResult({ kannada: item.kannada, roman: item.roman, meaning: item.meaning }); setTone(item.tone); setStyle(item.style); setInputKind(item.kind === "voice" ? "voice" : "text"); setError(""); setNotice("Previous translation loaded."); setHistoryOpen(false);
  };

  const translate = async () => {
    if (busy) return;
    setError(""); setNotice(""); setResult(null); setSaved(false); setCopied("");
    if (!text.trim()) { setError("Tap the microphone and speak to get a translation."); return; }
    if (!source) { setError("Choose a supported source language from the list."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, source: source.code, target: "Kannada", tone, style }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Translation failed.");
      const output: Output = { kannada: data.kannada, roman: data.roman, meaning: data.meaning };
      setResult(output);
      const entry = makeRecord({ source: text, sourceLanguage: source.label, kind: inputKind, ...output, tone, style });
      const history = readRecords(HISTORY_KEY);
      if (!writeRecords(HISTORY_KEY, [entry, ...history].slice(0, 100))) setNotice("Translation complete. Browser storage is unavailable, so it wasn’t added to history.");
      void fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ record: entry }) }).then(async response => { if (!response.ok) { const detail = await response.json().catch(() => ({})); setNotice(detail.message || "Translation complete, but Atlas history sync failed. Check MongoDB settings."); } }).catch(() => setNotice("Translation complete, but Atlas history sync failed. Check your connection."));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reach the translation service. Check your connection and retry."); }
    finally { setBusy(false); }
  };

  const microphone = () => {
    setInputError("");
    if (!window.isSecureContext && location.hostname !== "localhost") { setInputError("Microphone access requires a secure HTTPS connection."); return; }
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) { setInputError("Speech input isn’t available in this browser. Try Chrome or Edge, or type your text."); return; }
    try {
      const instance = new Constructor(); instance.lang = source?.speech || "en-US"; instance.interimResults = true; instance.continuous = false;
      instance.onresult = event => { setInputKind("voice"); setText(Array.from(event.results).map(item => item[0].transcript).join("")); };
      instance.onerror = event => { setRecording(false); setInputError(event.error === "not-allowed" ? "Microphone permission was denied. Allow it in browser settings and try again." : event.error === "no-speech" ? "No speech was detected. Please try again." : `Speech input stopped (${event.error}). You can type instead.`); };
      instance.onend = () => setRecording(false);
      recognition.current = instance; setRecording(true); instance.start();
    } catch { setRecording(false); setInputError("Could not start speech input. You can type instead."); }
  };

  const listen = (rate: number) => {
    if (!result) return;
    setNotice("");
    const playback = speakKannada(result.kannada, rate === .85 && playbackSpeed === "slow" ? .62 : rate, () => setNotice("Speech playback failed. Check your device audio settings."), result.roman);
    if (playback === "pronunciation") setNotice("No Kannada voice is available; playing the pronunciation instead.");
    else if (!playback) setNotice("Speech playback is unavailable in this browser.");
  };
  const copy = async (value: string, kind: "kannada" | "roman") => {
    try { await navigator.clipboard.writeText(value); setCopied(kind); window.setTimeout(() => setCopied(""), 1600); }
    catch { setNotice("Could not copy. Select and copy the text manually."); }
  };
  const save = () => {
    if (!result || saved) return;
    const entry = makeRecord({ source: text, sourceLanguage: sourceLabel, kind: inputKind, ...result, tone, style });
    if (!writeRecords(SAVED_KEY, [entry, ...readRecords(SAVED_KEY)].slice(0, 100))) { setNotice("Could not save this translation in browser storage."); return; }
    setSaved(true); setNotice("Saved on this device.");
  };

  return <><div className="translator-page"><div className="translator-grid">
    <section className="translate-panel voice-first-panel" aria-label="Speak to translate">
      <div className="source-row"><label className="source-picker-label" htmlFor="source-language">From</label><select id="source-language" className="source-search" value={sourceLabel} onChange={event => { setSourceLabel(event.target.value); const chosen = languages.find(language => language.label === event.target.value); if (chosen) setPreferredSourceLanguage(chosen.code); }} aria-label="Source language">{languages.map(language => <option key={language.code} value={language.label}>{language.label}</option>)}</select><span className="fixed-target-arrow" aria-hidden="true"><Icon name="arrow"/></span><div className="target-fixed"><span lang="kn">ಕನ್ನಡ</span><strong>Kannada</strong></div></div>
      <details className="translation-preferences"><summary>Translation preferences</summary><div className="preference-controls"><div><span>Tone</span><div className="segmented" role="group" aria-label="Translation tone"><button type="button" aria-pressed={tone === "formal"} onClick={() => { setTone("formal"); localStorage.setItem("kannadamitra-tone", "formal"); }}>Formal</button><button type="button" aria-pressed={tone === "casual"} onClick={() => { setTone("casual"); localStorage.setItem("kannadamitra-tone", "casual"); }}>Casual</button></div></div><div><span>Style</span><div className="segmented" role="group" aria-label="Translation style"><button type="button" aria-pressed={style === "natural"} onClick={() => { setStyle("natural"); localStorage.setItem("kannadamitra-style", "natural"); }}>Natural</button><button type="button" aria-pressed={style === "literal"} onClick={() => { setStyle("literal"); localStorage.setItem("kannadamitra-style", "literal"); }}>Literal</button></div></div></div></details>
      <div className={`input-wrap voice-capture ${recording ? "is-listening" : ""}`}>
        <div className="voice-capture-copy"><span className="voice-state-label">{recording ? "LISTENING NOW" : text ? "RECOGNIZED SPEECH" : "VOICE INPUT"}</span><div className="recognized-text" lang={source?.code} aria-live="polite">{text || (recording ? "Listening… say a phrase naturally." : "Your spoken words will appear here.")}</div><p className="voice-instruction">{recording ? "Tap the microphone when you’re finished." : "Tap the microphone and speak in " + sourceLabel + "."}</p></div>
        {recording && <span className="voice-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>}
        <button type="button" className={`mic-control voice-mic ${recording ? "is-recording" : ""}`} aria-label={recording ? "Stop speech input" : "Start speaking"} title={recording ? "Stop listening" : "Start speaking"} onClick={() => { if (recording) { try { recognition.current?.stop(); } catch { setRecording(false); } } else microphone(); }}><Icon name="microphone"/></button>
      </div>
      {!sourceValid && <p className="inline-validation" role="alert">Choose a language from the supported list.</p>}{inputError && <p className="translator-error" role="alert">{inputError}</p>}
      <button className="btn translate-submit" type="button" onClick={() => void translate()} disabled={busy || !text.trim() || !sourceValid}>{busy ? <><span className="spinner"/> Translating…</> : "Translate to Kannada"}</button>
      <div className="input-meta"><span>{text.length.toLocaleString()} / 12,000 characters recognized</span><span>Speech input</span></div>
      {error && <p className="translator-error" role="alert">{error}</p>}
    </section>
    <section className="result-panel" aria-labelledby="result-title" aria-live="polite"><div className="result-heading"><h1 id="result-title">Kannada translation</h1><button ref={historyButton} className="history-shortcut" type="button" onClick={() => setHistoryOpen(value => !value)} aria-haspopup="dialog" aria-expanded={historyOpen}><Icon name="history"/> History</button>{result && <span className="result-status">Translation complete</span>}</div>{busy ? <div className="translation-loading"><span className="spinner large"/><span>Translating…</span></div> : result ? <><div className="result-script" lang="kn">{result.kannada}</div><div className="result-roman">{result.roman}</div><div className="result-meaning"><span>Meaning in English</span><p>{result.meaning}</p></div><div className="result-actions"><button type="button" className="result-action" disabled={!voiceAvailable} onClick={() => listen(.85)} aria-label="Listen to Kannada translation"><Icon name="play"/><span>Listen</span></button><button type="button" className="result-action" disabled={!voiceAvailable} onClick={() => listen(.62)} aria-label="Listen to Kannada translation slowly"><Icon name="clock"/><span>Slow</span></button><button type="button" className="result-action" onClick={() => void copy(result.kannada, "kannada")}><Icon name="copy"/><span>{copied === "kannada" ? "Copied" : "Copy Kannada"}</span></button><button type="button" className="result-action" onClick={() => void copy(result.roman, "roman")}><Icon name="copy"/><span>{copied === "roman" ? "Copied" : "Copy pronunciation"}</span></button><button type="button" className="result-action save-action" disabled={saved} onClick={save}>{saved ? <Icon name="check"/> : <Icon name="bookmark"/>}<span>{saved ? "Saved" : "Save"}</span></button></div>{!voiceAvailable && <p className="audio-hint">Speech playback is not supported by this browser. Try an updated version of Chrome, Edge, or Safari.</p>}</> : error ? <div className="translation-empty error-empty"><span className="empty-symbol" aria-hidden="true">!</span><p>{error}</p><button className="btn retry-button" onClick={() => void translate()} disabled={busy || !text.trim() || !sourceValid}>Retry translation</button></div> : <div className="translation-empty"><span className="empty-symbol" aria-hidden="true">ಕ</span><p>Your translation will appear here.</p></div>}{notice && <p className="inline-notice" role="status">{notice}</p>}</section>
  </div><p className="privacy-note">Recognized speech is sent to Gemini when you request a translation. Translation history syncs to your account in MongoDB Atlas; saved items stay in this browser.</p></div>{historyOpen&&<><button className="history-drawer-backdrop" type="button" aria-label="Close translation history" onClick={()=>setHistoryOpen(false)}/><aside ref={historyPanel} className="history-drawer" role="dialog" aria-modal="true" aria-labelledby="history-drawer-title" tabIndex={-1}><TranslationLibrary kind="history" mode="drawer" onClose={()=>setHistoryOpen(false)} onReuse={reuseFromHistory}/></aside></>}</>;
}
