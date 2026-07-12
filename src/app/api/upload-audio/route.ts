import { put } from "@vercel/blob";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function blobStorageEnabled(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_STORE_ID ||
      process.env.VERCEL_OIDC_TOKEN,
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("audio");
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "No audio file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Audio too large (max 2MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (blobStorageEnabled()) {
    try {
      // On Vercel: uses BLOB_STORE_ID + OIDC, or BLOB_READ_WRITE_TOKEN
      const blob = await put(
        `homework/${session.username}-${Date.now()}.webm`,
        buffer,
        {
          access: "public",
          contentType: "audio/webm",
          addRandomSuffix: true,
        },
      );
      return Response.json({ url: blob.url, storage: "blob" });
    } catch (err) {
      console.error("[blob upload]", err);
      return Response.json(
        { error: "Blob upload failed. Check Storage connection." },
        { status: 500 },
      );
    }
  }

  // Fallback when Blob is not configured (local dev)
  const base64 = buffer.toString("base64");
  const dataUrl = `data:audio/webm;base64,${base64}`;
  return Response.json({ url: dataUrl, storage: "inline" });
}
