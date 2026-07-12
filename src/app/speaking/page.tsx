import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { SpeakingPractice } from "@/components/speaking-practice";
import { prisma } from "@/lib/db";
import { buildSpeakingPhrases } from "@/lib/exercises";
import { parsePersonPhrases } from "@/lib/types";

export default async function SpeakingPage() {
  const user = await requireLearner();

  const words = await prisma.word.findMany({
    orderBy: [{ isCustom: "desc" }, { hskLevel: "asc" }],
    take: 12,
  });

  const lin = await prisma.personCard.findFirst({ where: { name: "Lin" } });
  const linPhrases = lin
    ? parsePersonPhrases(lin.phrases).map((p, i) => ({
        id: `lin-${i}`,
        chinese: p.chinese,
        pinyin: p.pinyin,
        english: p.english,
      }))
    : [];

  const phrases = buildSpeakingPhrases(words, linPhrases);

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Speaking"
        subtitle="Listen · record · compare · ~5 min"
      >
        <SpeakingPractice phrases={phrases} />
      </PageShell>
    </>
  );
}
