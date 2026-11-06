"use client";
import Link from "next/link";
import { lessons } from "@/lib/data";
import { badges, todayPoints, useStore } from "@/lib/store";
import Icon from "@/components/Icon";

function getStreak(days: Record<string, number>) {
  const today = new Date();
  const key = (date: Date) => date.toISOString().slice(0, 10);
  const check = new Date(today);
  if (!(days[key(check)] > 0)) check.setDate(check.getDate() - 1);
  let count = 0;
  while (days[key(check)] > 0 && count < 365) {
    count++;
    check.setDate(check.getDate() - 1);
  }
  return count;
}

export default function Home() {
  const { s } = useStore();
  const next = lessons.find(lesson => !s.completed.includes(lesson.slug)) || lessons[0];
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const id = date.toISOString().slice(0, 10);
    return { day: date.toLocaleDateString("en", { weekday: "short" }), xp: s.days[id] || 0 };
  });
  const streak = getStreak(s.days);
  const progress = Math.round(s.completed.length / lessons.length * 100);
  const earnedBadges = badges(s).filter(badge => badge.got);

  return <div className="home-app">
    <header className="home-welcome">
      <div className="home-welcome-copy">
        <div className="eyebrow">YOUR KANNADAMITRA</div>
        <h1>Namaskara, welcome back.</h1>
        <p className="subhead">A little Kannada goes a long way.</p>
      </div>
      <div className="home-kannada-quote" lang="kn" aria-label="ಕಲಿಯಿರಿ · ಬೆಳೆಯಿರಿ">ಕಲಿಯಿರಿ <span aria-hidden="true">·</span> ಬೆಳೆಯಿರಿ</div>
      <Link className="btn" href="/translate">Translate text <span aria-hidden="true">→</span></Link>
    </header>

    <div className="home-content-grid">
      <section className="home-column">
        <div className="home-action-grid">
          <Link className="home-action-card primary-action" href="/translate"><span className="home-action-icon"><Icon name="translate"/></span><span><strong>Translate</strong><small>Text and voice into Kannada</small></span><span className="home-arrow"><Icon name="arrow"/></span></Link>
          <Link className="home-action-card" href="/camera"><span className="home-action-icon"><Icon name="camera"/></span><span><strong>Camera</strong><small>Scan and translate a photo</small></span><span className="home-arrow"><Icon name="arrow"/></span></Link>
        </div>
        <Link href={`/learn/${next.slug}`} className="continue-card"><div><span className="eyebrow">CONTINUE LEARNING</span><h2>{next.title}</h2><p>{next.blurb}</p><span className="continue-link">Open lesson →</span></div><span lang="kn" className="continue-kannada">{next.scene}</span></Link>
      </section>

      <aside className="home-column">
        <section className="home-card streak-card"><div className="home-card-head"><h2>Your momentum</h2></div><div className="momentum-row"><div><strong>{streak}</strong><span>day streak</span></div><Icon name="streak" className="streak-flame"/><div className="momentum-divider"/><div><strong>{todayPoints(s)}<small> XP</small></strong><span>today</span></div></div></section>
        <section className="home-card achievements-card"><div className="home-card-head"><h2>Achievements</h2><span className="achievements-count">{earnedBadges.length} earned</span></div>{earnedBadges.length ? <ul className="dashboard-achievement-list">{earnedBadges.map(badge => <li key={badge.name}><span aria-hidden="true">✦</span>{badge.name}</li>)}</ul> : <p className="dashboard-achievement-empty">Your first achievement arrives when you complete a lesson.</p>}<Link href="/learn" className="btn ghost small">Explore lessons</Link></section>
      </aside>
      <section className="home-card progress-card">
        <div className="home-card-head"><h2>Your progress</h2><Link href="/learn">Learning book →</Link></div>
        <div className="progress-overview"><div className="progress-summary"><strong>{progress}%</strong><span>{s.completed.length} of {lessons.length} lessons</span><progress value={s.completed.length} max={lessons.length} aria-label="Lessons completed"/></div><div className="progress-number"><strong>{s.points}</strong><span>Total points</span></div></div>
        <div className="week-overview" role="img" aria-label="XP activity over the past seven days">{week.map((item, i) => <div className="week-day-mini" key={`${item.day}-${i}`}><div className="mini-bar"><i style={{ height: `${Math.min(100, item.xp * 5)}%` }}/></div><span>{item.day}</span></div>)}</div>
      </section>
    </div>
  </div>;
}
