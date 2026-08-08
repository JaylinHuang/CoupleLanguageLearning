import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { cultureArticles } from "@/lib/culture";

export default async function CulturePage() {
  const user = await requireLearner();

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Culture & Etiquette"
        subtitle="Small guide for meeting family · Mga tip sa kultura"
      >
        <div className="space-y-6">
          {cultureArticles.map((article) => (
            <article key={article.id} className="card p-5">
              <h2 className="text-xl font-semibold text-warm-brown">
                {article.title}
              </h2>
              <p className="text-sm text-warm-gray">{article.subtitle}</p>

              <div className="mt-4 space-y-4">
                {article.sections.map((section) => (
                  <div key={section.heading}>
                    <h3 className="font-medium text-coral-dark">
                      {section.heading}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-warm-brown">
                      {section.body}
                    </p>
                    {section.phrases ? (
                      <div className="mt-3 space-y-2">
                        {section.phrases.map((p) => (
                          <div
                            key={p.chinese}
                            className="rounded-xl bg-blush/30 px-3 py-2"
                          >
                            <p className="font-chinese text-lg">{p.chinese}</p>
                            <p className="text-sm text-coral-dark">{p.pinyin}</p>
                            <p className="text-xs text-warm-gray">{p.english}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </PageShell>
    </>
  );
}
