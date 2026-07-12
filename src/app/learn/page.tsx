import Link from "next/link";
import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { prisma } from "@/lib/db";

export default async function LearnPage() {
  const user = await requireLearner();

  const lessons = await prisma.lesson.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      progress: { where: { userId: user.id } },
      _count: { select: { words: true } },
    },
  });

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Learning Path"
        subtitle="HSK-based lessons · couple scenes first"
      >
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const done = lesson.progress[0]?.status === "COMPLETED";
            return (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.id}`}
                className="card flex items-center justify-between gap-4 p-4 transition hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-warm-brown">{lesson.title}</p>
                  <p className="text-sm text-warm-gray">{lesson.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="badge">HSK {lesson.hskLevel}</span>
                    {lesson.sceneTag ? (
                      <span className="badge">{lesson.sceneTag}</span>
                    ) : null}
                    <span className="text-xs text-warm-gray">
                      {lesson._count.words} words
                    </span>
                  </div>
                </div>
                <span className="text-sm text-coral-dark">
                  {done ? "Done ✓" : "Start →"}
                </span>
              </Link>
            );
          })}
        </div>
      </PageShell>
    </>
  );
}
