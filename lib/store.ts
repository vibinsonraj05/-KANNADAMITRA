"use client";
import { useCallback, useEffect, useState } from "react";
import { lessons } from "./data";

export const LANGS = ["English", "Tamil", "Hindi", "Telugu", "Malayalam"] as const;
export type LearningStage = "learn" | "listen" | "practise" | "speak" | "quiz";
export type LearningResume = { slug: string; phraseIndex: number; stage: LearningStage };
export type State = { lang: string; goal: number; completed: string[]; built: string[]; best: Record<string, number>; points: number; days: Record<string, number>; resume?: LearningResume; completedStages?: Record<string, LearningStage[]> };
const KEY = "kfe-state";
const init: State = { lang: "English", goal: 20, completed: [], built: [], best: {}, points: 0, days: {} };
const day = () => new Date().toISOString().slice(0, 10);

function load(): State {
  try { return { ...init, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return init; }
}
export function useStore() {
  const [s, setS] = useState<State>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => { setS(load()); setReady(true); }, []);
  const update = useCallback((fn: (s: State) => State) => {
    const n = fn(load());
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {}
    setS(n);
  }, []);
  return { s, update, ready };
}
export const addPoints = (s: State, p: number): State => ({ ...s, points: s.points + p, days: { ...s.days, [day()]: (s.days[day()] || 0) + p } });
export const todayPoints = (s: State) => s.days[day()] || 0;
export const badges = (s: State) => [
  { name: "First lesson", got: s.completed.length >= 1 },
  { name: "Five lessons", got: s.completed.length >= 5 },
  { name: "All lessons", got: s.completed.length >= lessons.length },
  { name: "Perfect quiz", got: lessons.some((l) => s.best[l.slug] === l.phrases.length) },
  { name: "Daily goal met", got: todayPoints(s) >= s.goal },
];
