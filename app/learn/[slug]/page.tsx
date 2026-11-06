import { notFound } from "next/navigation";
import Lesson from "@/components/Lesson";
import { getLesson, lessons } from "@/lib/data";

export function generateStaticParams() { return lessons.map((l) => ({ slug: l.slug })); }

export default function Page({ params }: { params: { slug: string } }) {
  const lesson = getLesson(params.slug);
  if (!lesson) notFound();
  return <Lesson lesson={lesson} />;
}
