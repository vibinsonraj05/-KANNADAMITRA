"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
export type SpeechResult = "kannada" | "pronunciation" | false;
export function speak(text: string, rate = 0.85, onError?: () => void, pronunciation?: string): SpeechResult {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    const w = window.speechSynthesis;
    w.cancel();
    const voices = w.getVoices();
    const kannadaVoice = voices.find(voice => voice.lang.toLowerCase() === "kn-in") || voices.find(voice => voice.lang.toLowerCase().startsWith("kn"));
    const fallbackVoice = voices.find(voice => voice.lang.toLowerCase() === "en-in") || voices.find(voice => voice.lang.toLowerCase().startsWith("en")) || voices.find(voice => voice.default) || voices[0];
    const usePronunciation = !kannadaVoice && Boolean(pronunciation?.trim());
    const u = new SpeechSynthesisUtterance((usePronunciation ? pronunciation! : text).replace("…", ""));
    u.lang = kannadaVoice ? "kn-IN" : usePronunciation ? fallbackVoice?.lang || "en-IN" : "kn-IN";
    u.rate = rate;
    if (kannadaVoice) u.voice = kannadaVoice;
    else if (usePronunciation && fallbackVoice) u.voice = fallbackVoice;
    u.onerror = () => onError?.();
    w.resume();
    w.speak(u);
    return usePronunciation ? "pronunciation" : "kannada";
  } catch { return false; }
}
export default function Speak({ text, label = "Play audio", pronunciation }: { text: string; label?: string; pronunciation?: string }) {
  const [msg, setMsg] = useState("");
  const [available, setAvailable] = useState(false);
  const [rate, setRate] = useState(.85);
  useEffect(() => {
    const check = () => setAvailable(typeof window !== "undefined" && "speechSynthesis" in window);
    const readSpeed = () => setRate(localStorage.getItem("kannadamitra-speed") === "slow" ? .62 : .85);
    check(); readSpeed(); window.speechSynthesis?.addEventListener?.("voiceschanged", check); window.addEventListener("storage", readSpeed);
    return () => { window.speechSynthesis?.removeEventListener?.("voiceschanged", check); window.removeEventListener("storage", readSpeed); };
  }, []);
  return (
    <span className="speak">
      <button className="icon" aria-label={label} type="button" disabled={!available || !text.trim()} title={available ? label : "Speech playback is unavailable in this browser"} onClick={() => { const outcome = speak(text, rate, () => setMsg("Speech playback failed. Check your device audio settings."), pronunciation); setMsg(outcome === "pronunciation" ? "No Kannada voice is available; playing the pronunciation instead." : outcome ? "" : "Speech playback is unavailable in this browser."); }}><Icon name="play"/></button>
      {msg && <span role="status" className="warn">{msg}</span>}
    </span>
  );
}
