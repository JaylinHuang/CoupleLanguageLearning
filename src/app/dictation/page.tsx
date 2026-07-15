import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { DictationPractice } from "@/components/dictation-practice";
import { prisma } from "@/lib/db";
import { buildDictationExercises } from "@/lib/exercises";

export default async function DictationPage() {
  const user = await requireLearner();

  // 优先用她正在复习的词，凑不够再补词库里的词
  const cards = await prisma.reviewCard.findMany({
    where: { userId: user.id },
    include: { word: true },
    orderBy: { dueDate: "asc" },
    take: 12,
  });

  let words = cards.map((c) => c.word);
  if (words.length < 8) {
    const extra = await prisma.word.findMany({
      where: { id: { notIn: words.map((w) => w.id) } },
      orderBy: [{ isCustom: "desc" }, { hskLevel: "asc" }],
      take: 12 - words.length,
    });
    words = [...words, ...extra];
  }

  const exercises = buildDictationExercises(words);

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Dictation"
        subtitle="Listen · type what you hear (hanzi or pinyin) · ~5 min"
      >
        <DictationPractice exercises={exercises} />
      </PageShell>
    </>
  );
}
