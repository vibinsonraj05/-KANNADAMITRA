"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LearningStage } from "@/lib/store";
import type { Lesson as L } from "@/lib/data";
import { addPoints, useStore } from "@/lib/store";
import { lessons } from "@/lib/data";
import Quiz from "./Quiz";
import Speak from "./Speak";
import SentenceBuilder from "./SentenceBuilder";
import Icon from "@/components/Icon";

const stages: { id: LearningStage; label: string }[] = [
  { id: "learn", label: "Learn" }, { id: "listen", label: "Listen" }, { id: "practise", label: "Practise" }, { id: "speak", label: "Speak" }, { id: "quiz", label: "Quick Quiz" },
];

export default function Lesson({ lesson }: { lesson: L }) {
  const { s, update, ready } = useStore();
  const [stage, setStage] = useState<LearningStage>("learn");
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState<number[]>([]);
  const [spoken, setSpoken] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<{ got: number; total: number } | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [restored, setRestored] = useState(false);
  const completedStages = s.completedStages?.[lesson.slug] || [];
  const phrase = lesson.phrases[index];
  const nextLesson = useMemo(() => lessons.find(item => !s.completed.includes(item.slug) && item.slug !== lesson.slug), [s.completed, lesson.slug]);

  useEffect(() => {
    if (!ready) return;
    if (s.resume?.slug === lesson.slug && !s.completed.includes(lesson.slug)) {
      setStage(s.resume.stage);
      setIndex(Math.min(Math.max(0, s.resume.phraseIndex), lesson.phrases.length - 1));
    }
    setRestored(true);
  }, [ready, lesson.slug, lesson.phrases.length]);

  useEffect(() => {
    if (!ready || !restored || finished) return;
    update(state => ({ ...state, resume: { slug: lesson.slug, phraseIndex: index, stage } }));
  }, [ready, restored, finished, lesson.slug, index, stage, update]);

  const markStage = (done: LearningStage) => update(state => {
    const current = state.completedStages?.[lesson.slug] || [];
    return { ...state, completedStages: { ...state.completedStages, [lesson.slug]: current.includes(done) ? current : [...current, done] } };
  });
  const advance = (next: LearningStage) => { markStage(stage); setStage(next); setIndex(0); };
  const complete = (result: { got: number; total: number }) => {
    setScore(result);
    const alreadyDone = s.completed.includes(lesson.slug);
    setXpAwarded(alreadyDone ? 0 : 10);
    update(state => {
      const alreadyDone = state.completed.includes(lesson.slug);
      const completed = alreadyDone ? state.completed : [...state.completed, lesson.slug];
      const current = state.completedStages?.[lesson.slug] || [];
      const allStages: LearningStage[] = ["learn", "listen", "practise", "speak", "quiz"];
      const next = addPoints({ ...state, completed, resume: undefined, completedStages: { ...state.completedStages, [lesson.slug]: [...new Set([...current, ...allStages])] } }, alreadyDone ? 0 : 10);
      return { ...next, resume: undefined };
    });
    setFinished(true);
  };

  if (!ready) return <div className="wrap lesson-loading" role="status">Loading your saved lesson…</div>;
  if (finished) return <div className="wrap lesson-experience">
    <Link href="/learn" className="lesson-back"><Icon name="arrow"/> Your learning path</Link>
    <section className="lesson-completion"><span className="lesson-completion-icon"><Icon name="check"/></span><div className="eyebrow">LESSON COMPLETE</div><h1>Nicely done.</h1><p className="subhead">You completed all five stages of {lesson.title}.</p>
      {score && <div className="lesson-score"><strong>{score.got}/{score.total}</strong><span>Quick Quiz score</span><b>{xpAwarded ? `+${xpAwarded} XP` : "XP already earned"}</b></div>}
      <div className="lesson-learned"><h2>Phrases you learned</h2><ul>{lesson.phrases.map(item=><li key={item.kn}><span lang="kn">{item.kn}</span><small>{item.en}</small></li>)}</ul></div>
      <div className="lesson-completion-actions">{nextLesson ? <Link className="btn" href={`/learn/${nextLesson.slug}`}>Next lesson <Icon name="arrow"/></Link> : <Link className="btn" href="/learn">Back to your journey <Icon name="arrow"/></Link>}<Link className="btn ghost" href="/learn">View learning path</Link></div>
    </section>
  </div>;

  return <div className="wrap lesson-experience">
    <Link href="/learn" className="lesson-back"><Icon name="arrow"/> Your learning path</Link>
    <div className="lesson-intro"><div className="eyebrow">GUIDED LESSON</div><h1>{lesson.title}</h1><p className="muted">{lesson.blurb}</p></div>
    <div className="lesson-stage-progress" aria-label={`Stage ${stages.findIndex(item=>item.id===stage)+1} of ${stages.length}`}><div>{stages.map((item, i)=><div className={`lesson-stage-step ${stage===item.id?"is-active":""} ${completedStages.includes(item.id)?"is-complete":""}`} key={item.id}><span>{completedStages.includes(item.id)?<Icon name="check"/>:String(i+1).padStart(2,"0")}</span><small>{item.label}</small></div>)}</div><progress value={stages.findIndex(item=>item.id===stage)} max={stages.length-1}/></div>

    {stage === "learn" && <section className="card lesson-stage-card"><div className="lesson-card-top"><span className="eyebrow">LEARN · PHRASE {index+1} OF {lesson.phrases.length}</span><span lang="kn" className="lesson-scene">{lesson.scene}</span></div><div lang="kn" className="kn xl">{phrase.kn}</div><div className="roman">{phrase.roman}</div><p className="lesson-meaning"><strong>{phrase.en}</strong></p>{phrase.tip&&<p className="tip">{phrase.tip}</p>}<div className="row lesson-stage-actions"><button className="btn ghost" disabled={index===0} onClick={()=>setIndex(value=>Math.max(0,value-1))}>Back</button>{index+1<lesson.phrases.length?<button className="btn" onClick={()=>setIndex(value=>value+1)}>Next phrase <Icon name="arrow"/></button>:<button className="btn" onClick={()=>advance("listen")}>Continue to Listen <Icon name="arrow"/></button>}</div></section>}

    {stage === "listen" && <section className="card lesson-stage-card"><span className="eyebrow">LISTEN</span><h2>Hear the natural rhythm</h2><p className="muted">Play each phrase, then mark it reviewed. If audio is unavailable, read the pronunciation aloud.</p><ul className="lesson-phrase-list">{lesson.phrases.map((item,i)=><li key={item.kn}><div><span lang="kn">{item.kn}</span><small>{item.roman} · {item.en}</small></div><Speak text={item.kn} pronunciation={item.roman} label={`Listen to ${item.en}`}/><label className="lesson-check"><input type="checkbox" checked={reviewed.includes(i)} onChange={event=>setReviewed(value=>event.target.checked?[...new Set([...value,i])]:value.filter(x=>x!==i))}/><span>Reviewed</span></label></li>)}</ul><div className="row lesson-stage-actions"><button className="btn ghost" onClick={()=>setStage("learn")}>Back to Learn</button><button className="btn" disabled={reviewed.length<lesson.phrases.length} onClick={()=>advance("practise")}>Continue to Practise <Icon name="arrow"/></button></div></section>}

    {stage === "practise" && <section className="lesson-stage-card"><div className="lesson-practice-heading"><span className="eyebrow">PRACTISE</span><h2>Build the phrase from memory</h2><p className="muted">Arrange the Kannada words in the right order. Correctly build every phrase to continue.</p></div><SentenceBuilder lesson={lesson} onComplete={()=>advance("speak")}/></section>}

    {stage === "speak" && <section className="card lesson-stage-card"><span className="eyebrow">SPEAK</span><h2>Make these phrases your own</h2><p className="muted">Listen once, say each phrase aloud, then mark it practised.</p><ul className="lesson-phrase-list lesson-speak-list">{lesson.phrases.map((item,i)=><li key={item.kn}><div><span lang="kn">{item.kn}</span><small>{item.roman} · {item.en}</small></div><Speak text={item.kn} pronunciation={item.roman} label={`Hear ${item.en}`}/><label className="lesson-check"><input type="checkbox" checked={spoken.includes(i)} onChange={event=>setSpoken(value=>event.target.checked?[...new Set([...value,i])]:value.filter(x=>x!==i))}/><span>Said aloud</span></label></li>)}</ul><div className="row lesson-stage-actions"><button className="btn ghost" onClick={()=>setStage("practise")}>Back to Practise</button><button className="btn" disabled={spoken.length<lesson.phrases.length} onClick={()=>advance("quiz")}>Start Quick Quiz <Icon name="arrow"/></button></div></section>}

    {stage === "quiz" && <section className="lesson-stage-card"><div className="lesson-practice-heading"><span className="eyebrow">QUICK QUIZ</span><h2>Check what you remember</h2><p className="muted">Complete every question to finish this lesson and earn its XP.</p></div><Quiz lesson={lesson} onComplete={(got,total)=>complete({got,total})}/></section>}
  </div>;
}
