import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sm2, type ReviewQuality } from "@/lib/srs";
import { awardXp } from "@/lib/progress";

// 同步离线复习评分：按提交顺序逐条应用 SM-2 算法
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0 || items.length > 200) {
    return Response.json({ error: "Invalid items" }, { status: 400 });
  }

  let applied = 0;
  for (const item of items) {
    const cardId = String(item?.cardId ?? "");
    const quality = Number(item?.quality);
    if (!cardId || !(quality >= 0 && quality <= 5)) continue;

    const card = await prisma.reviewCard.findFirst({
      where: { id: cardId, userId: session.id },
    });
    if (!card) continue;

    const next = sm2(
      {
        ease: card.ease,
        interval: card.interval,
        repetitions: card.repetitions,
        dueDate: card.dueDate,
      },
      quality as ReviewQuality,
    );

    await prisma.reviewCard.update({
      where: { id: cardId },
      data: {
        ease: next.ease,
        interval: next.interval,
        repetitions: next.repetitions,
        dueDate: next.dueDate,
        lastReview: new Date(),
        markedHard: quality < 3 ? true : card.markedHard,
      },
    });
    applied += 1;
  }

  if (applied > 0) {
    await awardXp(session.id, applied * 2);
  }

  return Response.json({ applied });
}
