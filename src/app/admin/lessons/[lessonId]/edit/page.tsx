import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { LessonEditor } from "@/components/lesson-editor";
import { prisma } from "@/lib/db";
import { parseLessonContent } from "@/lib/types";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const admin = await requireAdmin();
  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) notFound();

  let content;
  try {
    content = parseLessonContent(lesson.content);
  } catch {
    content = {
      intro: "",
      sentences: [],
      typingPrompts: [],
      quiz: [],
    };
  }

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell
        title={`Edit: ${lesson.title}`}
        subtitle="Visual editor · intro / sentences / typing / quiz"
      >
        <LessonEditor
          lessonId={lesson.id}
          initialMeta={{
            title: lesson.title,
            description: lesson.description ?? "",
            hskLevel: lesson.hskLevel,
            sceneTag: lesson.sceneTag ?? "",
            published: lesson.published,
          }}
          initialContent={content}
        />
      </PageShell>
    </>
  );
}
