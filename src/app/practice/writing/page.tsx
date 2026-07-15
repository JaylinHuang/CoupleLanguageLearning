import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { WritingCheck } from "@/components/writing-check";

export default async function WritingPracticePage() {
  const user = await requireLearner();

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Writing Check"
        subtitle="Write Chinese · AI teacher corrects you gently"
      >
        <WritingCheck />
      </PageShell>
    </>
  );
}
