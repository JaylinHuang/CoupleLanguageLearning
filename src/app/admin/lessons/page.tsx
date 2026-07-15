import { requireAdmin } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { createLessonAction } from "@/app/actions/learning";
import { prisma } from "@/lib/db";

export default async function AdminLessonsPage() {
  const admin = await requireAdmin();

  const lessons = await prisma.lesson.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { words: true } } },
  });

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell title="Lessons" subtitle="Add and manage courses">
        <form action={createLessonAction} className="card mb-6 space-y-3 p-4">
          <h2 className="font-medium">New lesson</h2>
          <input name="title" className="input" placeholder="Lesson title" required />
          <input name="description" className="input" placeholder="Description" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="hskLevel" type="number" className="input" placeholder="HSK level" defaultValue={1} />
            <input name="sceneTag" className="input" placeholder="Scene tag (e.g. couple)" />
          </div>
          <button type="submit" className="btn-primary">
            Create lesson
          </button>
        </form>

        <div className="space-y-2">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-warm-gray">{l.description}</p>
                <p className="mt-1 text-xs text-warm-gray">
                  HSK {l.hskLevel} · {l.sceneTag ?? "general"} ·{" "}
                  {l._count.words} words ·{" "}
                  {l.published ? "published" : "draft"}
                </p>
              </div>
              <a
                href={`/admin/lessons/${l.id}/edit`}
                className="btn-primary shrink-0 text-sm"
              >
                Edit content
              </a>
            </div>
          ))}
        </div>
      </PageShell>
    </>
  );
}
