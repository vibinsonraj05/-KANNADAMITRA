"use client";
import Link from "next/link";
import { lessons } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { LessonLevel } from "@/lib/data";

export default function LessonGrid() {
  const { s } = useStore();
  const [level, setLevel] = useState<"all" | LessonLevel>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => lessons.filter(lesson => (level === "all" || (lesson.level || "beginner") === level) && `${lesson.title} ${lesson.blurb} ${lesson.scene}`.toLowerCase().includes(query.toLowerCase())), [level, query]);
  return (
    <>
    <div className="lesson-tools"><div className="lesson-levels" role="group" aria-label="Filter lessons by level">{(["all","beginner","intermediate","advanced"] as const).map(value=><button key={value} aria-pressed={level===value} onClick={()=>setLevel(value)}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div><label className="lesson-search"><span className="sr-only">Search lessons</span><input value={query} onChange={event=>setQuery(event.target.value)} type="search" placeholder="Search lessons"/></label></div>
    <ul className="grid">
      {visible.map((l) => (
        <li key={l.slug}>
          <Link href={`/learn/${l.slug}`} className="tile">
            <span lang="kn" className="scene">{l.scene}</span>
            <strong>{l.title}</strong>
            <span className="muted">{l.blurb}</span>
            <span className="meta"><span className="lesson-level-tag">{l.level || "beginner"}</span> {l.phrases.length} phrases{s.completed.includes(l.slug) ? " · completed" : ""}{s.best[l.slug] !== undefined ? ` · best quiz ${s.best[l.slug]}/${l.phrases.length}` : ""}</span>
          </Link>
        </li>
      ))}
    </ul>{visible.length===0&&<div className="home-empty">No lessons match your search.</div>}
    </>
  );
}
