import { notFound } from "next/navigation";
import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { LessonPlayer } from "@/components/lesson-player";
import { prisma } from "@/lib/db";
import { parseLessonContent } from "@/lib/types";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const user = await requireLearner();
  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      words: {
        orderBy: { order: "asc" },
        include: { word: true },
      },
    },
  });

  if (!lesson) notFound();

  const content = parseLessonContent(lesson.content);
  const words = lesson.words.map((lw) => lw.word);

  return (
    <>
      <SiteHeader user={user} />
      <PageShell title={lesson.title} subtitle={lesson.description ?? undefined}>
        <LessonPlayer
          lessonId={lesson.id}
          title={lesson.title}
          content={content}
          words={words}
        />
      </PageShell>
    </>
  );
}
