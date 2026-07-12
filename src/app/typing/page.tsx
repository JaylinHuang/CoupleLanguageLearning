import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { TypingPractice } from "@/components/typing-practice";
import { prisma } from "@/lib/db";
import { buildTypingExercises } from "@/lib/exercises";

export default async function TypingPage() {
  const user = await requireLearner();

  const words = await prisma.word.findMany({
    orderBy: [{ hskLevel: "asc" }, { simplified: "asc" }],
    take: 10,
  });

  const exercises = buildTypingExercises(words);

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Typing"
        subtitle="Pinyin with number tones · e.g. ni3hao3"
      >
        <TypingPractice exercises={exercises} />
      </PageShell>
    </>
  );
}
