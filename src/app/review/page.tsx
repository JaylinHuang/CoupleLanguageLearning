import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { ReviewSession } from "@/components/review-session";
import { prisma } from "@/lib/db";

export default async function ReviewPage() {
  const user = await requireLearner();

  const cards = await prisma.reviewCard.findMany({
    where: {
      userId: user.id,
      dueDate: { lte: new Date() },
      wordId: { not: null },
    },
    include: { word: true },
    orderBy: { dueDate: "asc" },
    take: 20,
  });

  const safeCards = cards.filter(
    (c): c is typeof c & { word: NonNullable<(typeof c)["word"]> } =>
      c.word != null,
  );

  return (
    <>
      <SiteHeader user={user} />
      <PageShell title="Review" subtitle="Spaced repetition · ~5 minutes">
        <ReviewSession cards={safeCards} />
      </PageShell>
    </>
  );
}
