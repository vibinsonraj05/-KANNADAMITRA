"use client";
import { lessons } from "@/lib/data";
import { badges, todayPoints, useStore } from "@/lib/store";
export default function Progress() {
  const { s } = useStore();
  const t = todayPoints(s);
  return (
    <div className="wrap"><h1>Your progress</h1>
      <div className="card"><p>Today: <strong>{t} of {s.goal} points</strong></p>
        <progress value={Math.min(t, s.goal)} max={s.goal} aria-label="Daily goal" /></div>
      <div className="card"><p>Total points: <strong>{s.points}</strong></p>
        <p>Lessons completed: <strong>{s.completed.length} of {lessons.length}</strong></p></div>
      <h2>Quiz scores</h2>
      <ul className="plain">{lessons.map((l) => <li key={l.slug}>{l.title}: {s.best[l.slug] !== undefined ? `${s.best[l.slug]}/${l.phrases.length}` : "not taken"}</li>)}</ul>
      <h2>Badges</h2>
      <ul className="badges">{badges(s).map((b) => <li key={b.name} className={b.got ? "got" : ""}>{b.got ? "✓ " : ""}{b.name}</li>)}</ul>
      <p className="muted">Progress is saved in this browser only.</p></div>
  );
}
