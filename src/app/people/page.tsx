import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { prisma } from "@/lib/db";
import { parsePersonPhrases } from "@/lib/types";

export default async function PeoplePage() {
  const user = await requireLearner();

  // 兼容旧 seed 的 name=Lin 与新 seed 的 Partner
  const partner =
    (await prisma.personCard.findFirst({ where: { name: "Partner" } })) ??
    (await prisma.personCard.findFirst({ where: { name: "Lin" } }));

  const phrases = partner ? parsePersonPhrases(partner.phrases) : [];

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Partner"
        subtitle="Phrases your partner uses · Mga pariralang ginagamit"
      >
        {partner ? (
          <div className="space-y-4">
            <div className="card p-5">
              <p className="text-4xl">💑</p>
              <h2 className="mt-2 text-xl font-semibold text-warm-brown">
                {partner.name}
              </h2>
              <p className="text-sm text-warm-gray">{partner.relation}</p>
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
            Partner card is not set up yet.
          </div>
        )}
      </PageShell>
    </>
  );
}
