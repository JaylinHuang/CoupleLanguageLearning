import { requireAdmin } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { reviewHomeworkAction } from "@/app/actions/learning";
import { HomeworkAssignForm } from "@/components/homework-assign-form";
import { prisma } from "@/lib/db";

export default async function AdminHomeworkPage() {
  const admin = await requireAdmin();

  const homework = await prisma.homework.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submissions: {
        include: { user: { select: { displayName: true } } },
      },
    },
  });

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell title="Homework" subtitle="Assign tasks and review submissions">
        <HomeworkAssignForm />

        <div className="space-y-4">
          {homework.map((hw) => (
            <div key={hw.id} className="card p-4">
              <p className="font-medium">{hw.title}</p>
              {hw.description ? (
                <p className="text-sm text-warm-gray">{hw.description}</p>
              ) : null}
              {hw.audioPath ? (
                <div className="mt-2">
                  <p className="text-xs text-warm-gray">Your voice message:</p>
                  <audio src={hw.audioPath} controls className="mt-1 w-full" />
                </div>
              ) : null}
              <p className="mt-1 text-xs text-warm-gray">Status: {hw.status}</p>

              {hw.submissions.map((sub) => (
                <div key={sub.id} className="mt-3 rounded-xl bg-blush/20 p-3">
                  <p className="text-sm font-medium">{sub.user.displayName}</p>
                  <p className="text-sm">{sub.textAnswer ?? "(no text)"}</p>
                  {sub.audioPath ? (
                    <div className="mt-2">
                      <audio src={sub.audioPath} controls className="w-full" />
                      {sub.audioPath.startsWith("https://") ? (
                        <p className="mt-1 text-xs text-warm-gray">Stored in Vercel Blob</p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="text-xs text-warm-gray">
                    {sub.submittedAt.toLocaleString()}
                  </p>
                  {sub.feedback ? (
                    <p className="mt-2 text-sm text-coral-dark">Feedback: {sub.feedback}</p>
                  ) : (
                    <form action={reviewHomeworkAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="submissionId" value={sub.id} />
                      <input
                        name="feedback"
                        className="input"
                        placeholder="Your feedback..."
                      />
                      <button type="submit" className="btn-primary shrink-0">
                        Send
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </PageShell>
    </>
  );
}
