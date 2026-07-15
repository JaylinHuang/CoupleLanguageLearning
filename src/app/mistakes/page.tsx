import Link from "next/link";
import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { prisma } from "@/lib/db";
import type { QuizAnswerDetail } from "@/lib/types";

type MistakeRow = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  completedAt: Date;
  prompt: string;
  audioText?: string;
  userAnswer: string;
  correctAnswer: string;
};

export default async function MistakesPage() {
  const user = await requireLearner();

  const attempts = await prisma.lessonAttempt.findMany({
    where: { userId: user.id },
    include: { lesson: { select: { id: true, title: true } } },
    orderBy: { completedAt: "desc" },
    take: 30,
  });

  const mistakes: MistakeRow[] = [];
  for (const a of attempts) {
    let answers: QuizAnswerDetail[] = [];
    try {
      answers = JSON.parse(a.answers) as QuizAnswerDetail[];
    } catch {
      continue;
    }
    answers.forEach((ans, i) => {
      if (ans.isCorrect) return;
      mistakes.push({
        id: `${a.id}-${i}`,
        lessonId: a.lesson.id,
        lessonTitle: a.lesson.title,
        completedAt: a.completedAt,
        prompt: ans.prompt,
        audioText: ans.audioText,
        userAnswer: ans.userAnswer,
        correctAnswer: ans.correctAnswer,
      });
    });
  }

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="My Mistakes"
        subtitle="Wrong answers from lesson quizzes · Mga mali"
      >
        {mistakes.length === 0 ? (
          <div className="card p-6 text-center text-warm-gray">
            No mistakes yet — or you got everything right. Keep practicing!
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-warm-gray">
              {mistakes.length} wrong answers. Wrong words are also waiting in{" "}
              <Link href="/review" className="text-coral-dark underline">
                Review
              </Link>
              .
            </p>
            {mistakes.map((m) => (
              <div key={m.id} className="card space-y-2 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-medium text-coral-dark">
                    {m.lessonTitle}
                  </p>
                  <p className="text-xs text-warm-gray">
                    {m.completedAt.toLocaleString()}
                  </p>
                </div>
                <p className="font-medium text-warm-brown">{m.prompt}</p>
                {m.audioText ? (
                  <p className="font-chinese text-lg text-coral-dark">
                    🔊 {m.audioText}
                  </p>
                ) : null}
                <p className="text-sm">
                  <span className="text-warm-gray">Your answer: </span>
                  <span className="font-medium text-red-600">
                    {m.userAnswer || "(no answer)"}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-warm-gray">Correct: </span>
                  <span className="font-medium text-green-700">
                    {m.correctAnswer}
                  </span>
                </p>
                <Link
                  href={`/learn/${m.lessonId}`}
                  className="btn-secondary text-xs"
                >
                  Revisit lesson
                </Link>
              </div>
            ))}
            <Link href="/practice/smart-quiz" className="btn-primary inline-flex">
              Practice with Smart Quiz
            </Link>
          </div>
        )}
      </PageShell>
    </>
  );
}
