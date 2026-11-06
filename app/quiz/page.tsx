"use client";
import { useState } from "react";
import Quiz from "@/components/Quiz";
import { lessons } from "@/lib/data";
export default function QuizPage() {
  const [slug, setSlug] = useState(lessons[0].slug);
  const lesson = lessons.find((l) => l.slug === slug)!;
  return (
    <div className="wrap"><h1>Quiz</h1>
      <label className="field">Topic
        <select value={slug} onChange={(e) => setSlug(e.target.value)}>{lessons.map((l) => <option key={l.slug} value={l.slug}>{l.title}</option>)}</select></label>
      <Quiz lesson={lesson} /></div>
  );
}
