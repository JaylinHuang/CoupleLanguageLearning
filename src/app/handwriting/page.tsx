import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { HandwritingPractice } from "@/components/handwriting-practice";
import { prisma } from "@/lib/db";

export default async function HandwritingPage({
  searchParams,
}: {
  searchParams: Promise<{ char?: string }>;
}) {
  const user = await requireLearner();
  const { char } = await searchParams;

  // 优先练她的难词和复习词
  const cards = await prisma.reviewCard.findMany({
    where: { userId: user.id },
    include: { word: true },
    orderBy: [{ markedHard: "desc" }, { dueDate: "asc" }],
    take: 10,
  });

  let words = cards.map((c) => c.word);

  // 从词汇表跳转过来的字如果不在列表里，查出来放到最前面
  if (char) {
    const target = await prisma.word.findFirst({
      where: { simplified: char },
    });
    if (target && !words.some((w) => w.id === target.id)) {
      words = [target, ...words];
    } else if (target) {
      words = [target, ...words.filter((w) => w.id !== target.id)];
    }
  }

  if (words.length === 0) {
    words = await prisma.word.findMany({
      orderBy: [{ isCustom: "desc" }, { hskLevel: "asc" }],
      take: 10,
    });
  }

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Handwriting"
        subtitle="Learn stroke order · trace characters with your finger"
      >
        <HandwritingPractice
          words={words.map((w) => ({
            id: w.id,
            simplified: w.simplified,
            pinyin: w.pinyin,
            english: w.english,
          }))}
          initialChar={char}
        />
      </PageShell>
    </>
  );
}
