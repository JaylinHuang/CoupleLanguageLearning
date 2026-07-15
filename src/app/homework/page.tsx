import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { HomeworkSubmitForm } from "@/components/homework-submit";
import { prisma } from "@/lib/db";

export default async function HomeworkPage() {
  const user = await requireLearner();

  const homework = await prisma.homework.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submissions: { where: { userId: user.id } },
      assignedBy: { select: { displayName: true } },
    },
  });

  return (
    <>
      <SiteHeader user={user} />
      <PageShell title="Homework" subtitle="Tasks from Lin · text or voice">
        <div className="space-y-4">
          {homework.length === 0 ? (
            <div className="card p-6 text-center text-warm-gray">
              No homework yet. Lin will assign some soon!
            </div>
          ) : (
            homework.map((hw) => {
              const submission = hw.submissions[0];
              return (
                <div key={hw.id} className="card p-4">
                  <p className="font-medium text-warm-brown">{hw.title}</p>
                  {hw.description ? (
                    <p className="mt-1 text-sm text-warm-gray">{hw.description}</p>
                  ) : null}
                  {hw.audioPath ? (
                    <div className="mt-2 rounded-xl bg-blush/30 p-3">
                      <p className="text-xs font-medium text-coral-dark">
                        🎧 Voice message from Lin 💕
                      </p>
                      <audio src={hw.audioPath} controls className="mt-2 w-full" />
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-warm-gray">
                    From {hw.assignedBy.displayName} · {hw.status}
                  </p>

                  {submission ? (
                    <div className="mt-3 rounded-xl bg-blush/30 p-3 text-sm">
                      <p>Submitted: {submission.submittedAt.toLocaleString()}</p>
                      {submission.textAnswer ? <p>{submission.textAnswer}</p> : null}
                      {submission.audioPath ? (
                        <audio
                          src={submission.audioPath}
                          controls
                          className="mt-2 w-full"
                        />
                      ) : null}
                      {submission.feedback ? (
                        <p className="mt-2 font-medium text-coral-dark">
                          Lin: {submission.feedback}
                        </p>
                      ) : (
                        <p className="mt-2 text-warm-gray">
                          Waiting for Lin&apos;s feedback...
                        </p>
                      )}
                    </div>
                  ) : (
                    <HomeworkSubmitForm homeworkId={hw.id} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </PageShell>
    </>
  );
}
