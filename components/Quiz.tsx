"use client";
import { useEffect, useState } from "react";
import { lessons, type Lesson, type Phrase } from "@/lib/data";
import { addPoints, useStore } from "@/lib/store";
import Speak from "./Speak";

type Q = { answer: Phrase; options: Phrase[]; toKn: boolean };
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const build = (l: Lesson): Q[] => {
  const pool = lessons.flatMap((x) => x.phrases);
  return shuffle(l.phrases).map((answer, i) => ({
    answer, toKn: i % 2 === 0,
    options: shuffle([answer, ...shuffle(pool.filter((p) => p.kn !== answer.kn)).slice(0, 3)]),
  }));
};

export default function Quiz({ lesson, onComplete }: { lesson: Lesson; onComplete?: (score: number, total: number) => void }) {
  const { update } = useStore();
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const reset = () => { setQs(build(lesson)); setI(0); setScore(0); setPicked(null); };
  useEffect(reset, [lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!qs.length) return null;
  const done = i >= qs.length;

  const choose = (p: Phrase) => {
    if (picked) return;
    setPicked(p.kn);
    if (p.kn === qs[i].answer.kn) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= qs.length) {
      update((s) => {
        const previous = s.best[lesson.slug] ?? 0;
        const best = Math.max(previous, score);
        const nextState = { ...s, best: { ...s.best, [lesson.slug]: best } };
        return onComplete ? nextState : addPoints(nextState, Math.max(0, best - previous) * 5);
      });
      onComplete?.(score, qs.length);
    }
    setI(i + 1); setPicked(null);
  };

  if (done) return <section className="card"><h2>You scored {score} of {qs.length}</h2><p className="muted">{score === qs.length ? "Perfect. You earned full points." : "Review the phrases in Learn, then try again."}</p><button className="btn" onClick={reset}>Retry quiz</button></section>;
  const q = qs[i];
  return (
    <section className="card" aria-live="polite">
      <p className="muted">Question {i + 1} of {qs.length}: {q.toKn ? "Choose the Kannada for" : "What does this mean?"}</p>
      <h2 lang={q.toKn ? "en" : "kn"} className={q.toKn ? "" : "kn"}>{q.toKn ? q.answer.en : q.answer.kn}</h2>
      <div className="opts">
        {q.options.map((o) => {
          const st = picked ? (o.kn === q.answer.kn ? "right" : o.kn === picked ? "wrong" : "") : "";
          return (
            <button key={o.kn} className={`opt ${st}`} disabled={!!picked} onClick={() => choose(o)}>
              {q.toKn ? <><span lang="kn" className="kn">{o.kn}</span><span className="roman">{o.roman}</span></> : <span>{o.en}</span>}
            </button>
          );
        })}
      </div>
      {picked && <><p className={`quiz-feedback ${picked===q.answer.kn?"is-correct":"is-incorrect"}`} role="status">{picked===q.answer.kn ? "That’s right." : <>Not quite. <strong>{q.answer.en}</strong> means <span lang="kn">{q.answer.kn}</span>. {q.answer.tip || "Review the phrase, then continue."}</>}</p><div className="row">
        <Speak text={q.answer.kn} pronunciation={q.answer.roman} label="Hear answer" />
        <button className="btn" onClick={next}>{i + 1 >= qs.length ? "See score" : "Next"}</button></div></>}
    </section>
  );
}
