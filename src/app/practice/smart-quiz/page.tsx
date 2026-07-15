import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { SmartQuiz } from "@/components/smart-quiz";

export default async function SmartQuizPage() {
  const user = await requireLearner();

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Smart Quiz"
        subtitle="AI questions made from your mistakes & hard words"
      >
        <SmartQuiz />
      </PageShell>
    </>
  );
}
