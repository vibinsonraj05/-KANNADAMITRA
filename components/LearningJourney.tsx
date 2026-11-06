"use client";

import Link from "next/link";
import { useMemo } from "react";
import { lessons } from "@/lib/data";
import { badges, todayPoints, useStore } from "@/lib/store";
import Icon from "@/components/Icon";

const levels = [
  { id: "foundations", title: "Kannada Foundations", description: "Start with greetings and the phrases you will use every day.", slugs: ["greetings"] },
  { id: "everyday", title: "Everyday Conversations", description: "Shop, order food, and make everyday conversation feel natural.", slugs: ["market", "food", "everyday"] },
  { id: "confidence", title: "Speak with Confidence", description: "Ask for help, get around, and connect with people nearby.", slugs: ["transport", "neighbours"] },
  { id: "work", title: "College & Workplace", description: "Communicate clearly with classmates and colleagues.", slugs: ["college", "work"] },
  { id: "karnataka", title: "Life in Karnataka", description: "Use local courtesies and discover more of the state.", slugs: ["directions", "life-karnataka"] },
  { id: "fluent", title: "Fluent Communication", description: "Build on what you know and keep a conversation flowing.", slugs: ["fluent-communication"] },
];
const lessonBySlug = new Map(lessons.map(lesson => [lesson.slug, lesson]));
const localDay = (date: Date) => date.toISOString().slice(0, 10);

function streakCount(days: Record<string, number>) {
  const cursor = new Date();
  if (!days[localDay(cursor)]) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let count = 0;
  while (days[localDay(cursor)]) { count++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return count;
}

export default function LearningJourney() {
  const { s, ready } = useStore();
  const totalLessons = lessons.length;
  const completeCount = lessons.filter(lesson => s.completed.includes(lesson.slug)).length;
  const progress = Math.round((completeCount / totalLessons) * 100);
  const levelRows = useMemo(() => levels.map((level, index) => {
    const group = level.slugs.map(slug => lessonBySlug.get(slug)).filter((item): item is (typeof lessons)[number] => Boolean(item));
    const done = group.filter(lesson => s.completed.includes(lesson.slug)).length;
    const priorDone = levels.slice(0, index).every(prior => prior.slugs.every(slug => s.completed.includes(slug)));
    const locked = index > 0 && !priorDone;
    const status = done === group.length ? "completed" : locked ? "locked" : done > 0 || index === levels.findIndex(item => item.slugs.some(slug => !s.completed.includes(slug))) ? "in progress" : "available";
    const minutes = Math.max(5, Math.ceil(group.reduce((sum, lesson) => sum + lesson.phrases.length, 0) * 1.5));
    return { ...level, group, done, status, minutes };
  }), [s.completed]);
  const availableLevel = levelRows.find(level => level.status === "in progress" || level.status === "available");
  const resumeLesson = (s.resume && !s.completed.includes(s.resume.slug) && lessonBySlug.get(s.resume.slug)) || availableLevel?.group.find(lesson => !s.completed.includes(lesson.slug)) || lessons.find(lesson => !s.completed.includes(lesson.slug));
  const earnedBadges = badges(s).filter(badge => badge.got);
  const streak = streakCount(s.days);

  if (!ready) return <div className="journey-loading" role="status">Loading your saved learning progress…</div>;

  return <div className="learning-journey">
    <header className="journey-header">
      <div><div className="eyebrow">A GUIDED LEARNING PATH</div><h1>Your Kannada Journey</h1><p className="subhead">A steady path from your first greeting to confident conversation.</p></div>
      <div className="journey-overall" aria-label={`${progress}% overall lesson progress`}><div className="journey-progress-ring" style={{ "--journey-progress": `${progress}%` } as React.CSSProperties}><strong>{progress}%</strong></div><div><strong>{completeCount} of {totalLessons} lessons</strong><span>overall progress</span></div></div>
    </header>

    {resumeLesson ? <Link href={`/learn/${resumeLesson.slug}`} className="journey-continue">
      <span className="journey-continue-mark"><Icon name="play"/></span><span className="journey-continue-copy"><span className="eyebrow">CONTINUE LEARNING</span><strong>{resumeLesson.title}</strong><small>{resumeLesson.blurb}</small></span><span className="journey-continue-action">{s.resume?.slug === resumeLesson.slug ? "Resume" : "Start lesson"}<Icon name="arrow"/></span>
    </Link> : <section className="journey-finished"><strong>You’ve completed every lesson in this path.</strong><span>Revisit any lesson to review the phrases and quiz.</span></section>}

    <div className="journey-main-grid">
      <section className="journey-path-section journey-path-container" aria-labelledby="journey-path-title">
        <div className="journey-section-heading"><div><h2 id="journey-path-title">Your learning path</h2><p>Complete each level to open the next.</p></div><span>{totalLessons} lessons</span></div>
        <ol className="journey-level-list">
          {levelRows.map((level, index) => <li key={level.id} className={`journey-level journey-level-${level.status.replace(" ", "-")}`}>
            <div className="journey-level-rail" aria-hidden="true"><span>{level.status === "completed" ? <Icon name="check"/> : level.status === "locked" ? "·" : String(index + 1).padStart(2, "0")}</span>{index < levelRows.length - 1 && <i/>}</div>
            <section className="journey-level-card">
              <details className="journey-level-details">
              <summary className="journey-level-summary"><div className="journey-level-top"><div><div className="journey-level-kicker">LEVEL {String(index + 1).padStart(2, "0")}</div><h3>{level.title}</h3></div><span className="journey-status">{level.status}</span></div>
              <p className="journey-level-description">{level.description}</p>
              <div className="journey-level-meta"><span>{level.done} / {level.group.length} lessons</span><span>About {level.minutes} min</span></div>
              <progress value={level.done} max={Math.max(1, level.group.length)} aria-label={`${level.title} progress`}/></summary>
              <div className="journey-level-lessons">{level.group.map(lesson => {
                const done = s.completed.includes(lesson.slug);
                const active = !done && !level.status.includes("locked") && (s.resume?.slug === lesson.slug || (!s.resume && lesson.slug === resumeLesson?.slug));
                return <Link key={lesson.slug} href={level.status === "locked" ? "#journey-path-title" : `/learn/${lesson.slug}`} aria-disabled={level.status === "locked"} onClick={event => { if (level.status === "locked") event.preventDefault(); }} className={`journey-lesson ${done ? "is-done" : ""} ${active ? "is-current" : ""} ${level.status === "locked" ? "is-locked" : ""}`}>
                  <span className="journey-lesson-indicator">{done ? <Icon name="check"/> : level.status === "locked" ? "–" : "○"}</span><span><strong>{lesson.title}</strong><small>{lesson.phrases.length} phrases · {Math.max(4, lesson.phrases.length * 2)} min</small></span><Icon name="arrow" className="journey-lesson-arrow"/>
                </Link>;
              })}</div>
              </details>
            </section>
          </li>)}
        </ol>
      </section>

      <aside className="journey-side-column">
        <section className="journey-stat-card"><div className="journey-section-heading"><div><h2>Today’s goal</h2><p>Small, consistent steps add up.</p></div><span>{todayPoints(s)} / {s.goal} XP</span></div><progress value={Math.min(todayPoints(s), s.goal)} max={Math.max(1, s.goal)} aria-label="Daily XP goal"/><div className="journey-stat-row"><div><strong>{s.points}</strong><span>Total XP</span></div><div><strong>{streak}</strong><span>Day streak</span></div></div></section>
        <section className="journey-stat-card journey-achievement-card"><div className="journey-section-heading"><div><h2>Achievements</h2><p>Milestones earned along the way.</p></div><span>{earnedBadges.length}</span></div>{earnedBadges.length ? <ul>{earnedBadges.slice(-3).map(badge => <li key={badge.name}><span className="achievement-check"><Icon name="check"/></span>{badge.name}</li>)}</ul> : <p className="journey-empty-achievement">Your first milestone appears when you complete a lesson.</p>}</section>
        <p className="journey-storage-note">Learning progress and resume position are saved on this device.</p>
      </aside>
    </div>

  </div>;
}
