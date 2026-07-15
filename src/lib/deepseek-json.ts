// 直接调用 DeepSeek 并要求返回严格 JSON（用于语法批改、AI 出题等结构化任务）

export async function deepseekJson(
  systemPrompt: string,
  userContent: string,
  maxTokens = 800,
): Promise<unknown | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_CHAT_MODEL ?? "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("[deepseek-json]", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch (err) {
    console.error("[deepseek-json]", err);
    return null;
  }
}

// 普通文本回复（用于周报点评、角色扮演反馈等非结构化任务）
export async function deepseekText(
  systemPrompt: string,
  userContent: string,
  maxTokens = 500,
): Promise<string | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_CHAT_MODEL ?? "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      console.error("[deepseek-text]", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[deepseek-text]", err);
    return null;
  }
}
