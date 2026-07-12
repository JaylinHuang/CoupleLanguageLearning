import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { prisma } from "@/lib/db";
import { parsePersonPhrases } from "@/lib/types";

export default async function PeoplePage() {
  const user = await requireLearner();

  const lin = await prisma.personCard.findFirst({
    where: { name: "Lin" },
  });

  const phrases = lin ? parsePersonPhrases(lin.phrases) : [];

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Lin"
        subtitle="Phrases your boyfriend uses · Mga pariralang ginagamit ni Lin"
      >
        {lin ? (
          <div className="space-y-4">
            <div className="card p-5">
              <p className="text-4xl">💑</p>
              <h2 className="mt-2 text-xl font-semibold text-warm-brown">
                {lin.name}
              </h2>
              <p className="text-sm text-warm-gray">{lin.relation}</p>
            </div>

            <div className="space-y-3">
              {phrases.map((p) => (
                <div key={p.chinese} className="card p-4">
                  <p className="font-chinese text-2xl text-warm-brown">
                    {p.chinese}
                  </p>
                  <p className="text-sm text-coral-dark">{p.pinyin}</p>
                  <p className="mt-1 text-sm">{p.english}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center text-warm-gray">
            Lin&apos;s card is not set up yet.
          </div>
        )}
      </PageShell>
    </>
  );
}
