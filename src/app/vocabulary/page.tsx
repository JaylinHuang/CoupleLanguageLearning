import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { VocabularyClient } from "@/components/vocabulary-client";
import { prisma } from "@/lib/db";

export default async function VocabularyPage() {
  const user = await requireLearner();

  const words = await prisma.word.findMany({
    orderBy: [{ isCustom: "desc" }, { hskLevel: "asc" }, { simplified: "asc" }],
  });

  const hardIds = new Set(
    (
      await prisma.reviewCard.findMany({
        where: { userId: user.id, markedHard: true },
        select: { wordId: true },
      })
    ).map((c) => c.wordId),
  );

  const rows = words.map((w) => ({
    id: w.id,
    simplified: w.simplified,
    pinyin: w.pinyin,
    english: w.english,
    isCustom: w.isCustom,
    markedHard: hardIds.has(w.id),
  }));

  return (
    <>
      <SiteHeader user={user} />
      <PageShell title="Vocabulary" subtitle="Mark hard words · Tell Lin what you want to learn">
        <VocabularyClient words={rows} />
      </PageShell>
    </>
  );
}
