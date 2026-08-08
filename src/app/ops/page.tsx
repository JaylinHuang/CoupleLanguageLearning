import { headers } from "next/headers";
import { requirePlatformAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { SiteHeader, PageShell } from "@/components/layout";

function isLocalHost(host: string | null) {
  if (!host) return false;
  const h = host.split(":")[0]?.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

export default async function OpsHomePage() {
  const admin = await requirePlatformAdmin();
  const h = await headers();
  const host = h.get("host");
  const local = isLocalHost(host);

  const coupleCount = await prisma.couple.count();
  let importCount = 0;
  try {
    importCount = await prisma.corpusImport.count();
  } catch {
    importCount = 0;
  }
  const sharedChunks = await prisma.knowledgeChunk.count({
    where: { scope: "SHARED" },
  });

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell title="Ops (local)" subtitle="Platform admin · no private corpus bodies">
        {!local ? (
          <div className="rounded-xl border border-china-red/40 bg-blush p-4 text-sm text-china-red">
            Warning: Ops is intended for localhost only. Current host: {host}
          </div>
        ) : (
          <p className="text-sm text-warm-gray">
            Running on localhost — private corpus bodies are never shown here.
          </p>
        )}
        <ul className="mt-6 space-y-2 text-sm">
          <li>Couples: {coupleCount}</li>
          <li>Corpus imports (metadata only): {importCount}</li>
          <li>SHARED knowledge chunks: {sharedChunks}</li>
        </ul>
      </PageShell>
    </>
  );
}
