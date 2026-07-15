import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { RoleplayChat } from "@/components/roleplay-chat";
import { ROLEPLAY_SCENARIOS } from "@/lib/roleplay";

export default async function RoleplayPage() {
  const user = await requireLearner();

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Roleplay"
        subtitle="Practice real-life scenarios · AI plays the other person"
      >
        <RoleplayChat scenarios={[...ROLEPLAY_SCENARIOS]} />
      </PageShell>
    </>
  );
}
