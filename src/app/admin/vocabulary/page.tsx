import { requireAdmin } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { createWordAction } from "@/app/actions/learning";
import { prisma } from "@/lib/db";

export default async function AdminVocabularyPage() {
  const admin = await requireAdmin();

  const words = await prisma.word.findMany({
    orderBy: [{ isCustom: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell title="Vocabulary" subtitle="Add words to the shared library">
        <form action={createWordAction} className="card mb-6 grid gap-3 p-4 sm:grid-cols-2">
          <h2 className="font-medium sm:col-span-2">New word</h2>
          <input name="simplified" className="input" placeholder="汉字" required />
          <input name="pinyin" className="input" placeholder="nǐ hǎo" required />
          <input name="pinyinNumber" className="input" placeholder="ni3 hao3" />
          <input name="english" className="input" placeholder="English meaning" required />
          <input name="tagalogShort" className="input" placeholder="Tagalog (optional)" />
          <input name="hskLevel" type="number" className="input" defaultValue={1} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="isCustom" />
            Custom / couple word
          </label>
          <button type="submit" className="btn-primary sm:col-span-2">
            Add word
          </button>
        </form>

        <div className="space-y-2">
          {words.map((w) => (
            <div key={w.id} className="card flex items-center justify-between p-3">
              <div>
                <p className="font-chinese text-lg">{w.simplified}</p>
                <p className="text-sm text-warm-gray">
                  {w.pinyin} · {w.english}
                </p>
              </div>
              {w.isCustom ? <span className="badge">Custom</span> : null}
            </div>
          ))}
        </div>
      </PageShell>
    </>
  );
}
