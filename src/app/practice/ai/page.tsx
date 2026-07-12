import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { AiChat } from "@/components/ai-chat";

export default async function AiPracticePage() {
  const user = await requireLearner();

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Chat with Lin"
        subtitle="AI practice · relaxed conversation · DeepSeek"
      >
        <AiChat />
      </PageShell>
    </>
  );
}
