import type { SessionUser } from "@/lib/constants";

export function isRemoteAiService(): boolean {
  return !!process.env.AI_SERVICE_URL;
}

function getServiceUrl(): string {
  const url = process.env.AI_SERVICE_URL;
  if (!url) throw new Error("AI_SERVICE_URL not configured");
  return url.replace(/\/$/, "");
}

function serviceHeaders(user: SessionUser): HeadersInit {
  const key = process.env.AI_SERVICE_API_KEY;
  if (!key) throw new Error("AI_SERVICE_API_KEY not configured");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "X-User-Id": user.id,
    "X-User-Role": user.role,
  };
}

export async function proxyJson(
  user: SessionUser,
  path: string,
  body?: unknown,
  method = "POST",
): Promise<Response> {
  const res = await fetch(`${getServiceUrl()}${path}`, {
    method,
    headers: serviceHeaders(user),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function proxyStream(
  user: SessionUser,
  path: string,
  body: unknown,
): Promise<Response> {
  const res = await fetch(`${getServiceUrl()}${path}`, {
    method: "POST",
    headers: serviceHeaders(user),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "AI service error" }));
    return Response.json(err, { status: res.status });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function proxyGet(user: SessionUser, path: string): Promise<Response> {
  const res = await fetch(`${getServiceUrl()}${path}`, {
    headers: serviceHeaders(user),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
