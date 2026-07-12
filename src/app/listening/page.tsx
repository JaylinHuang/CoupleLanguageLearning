import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { ListeningQuiz } from "@/components/listening-quiz";
import { prisma } from "@/lib/db";
import { buildListeningExercises } from "@/lib/exercises";

export default async function ListeningPage() {
  const user = await requireLearner();

  const words = await prisma.word.findMany({
    orderBy: [{ isCustom: "desc" }, { hskLevel: "asc" }],
    take: 20,
  });

  const exercises = buildListeningExercises(words);

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Listening"
        subtitle="Listen · choose meaning · fill blanks · ~5 min"
      >
        <ListeningQuiz exercises={exercises} />
      </PageShell>
    </>
  );
}
