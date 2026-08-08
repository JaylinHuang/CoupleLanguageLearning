/**
 * encoding.v1：入库前严格 UTF-8 校验
 */
export type Utf8ValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: "utf16" | "invalid_utf8" | "empty" | "replacement" };

export function validateUtf8Bytes(buf: Buffer): Utf8ValidationResult {
  if (buf.length >= 2) {
    const b0 = buf[0];
    const b1 = buf[1];
    if ((b0 === 0xff && b1 === 0xfe) || (b0 === 0xfe && b1 === 0xff)) {
      return { ok: false, reason: "utf16" };
    }
  }

  let start = 0;
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    start = 3;
  }

  const slice = buf.subarray(start);
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const text = decoder.decode(slice);
    if (!text.trim()) return { ok: false, reason: "empty" };
    if (text.includes("\uFFFD")) return { ok: false, reason: "replacement" };
    return { ok: true, text };
  } catch {
    return { ok: false, reason: "invalid_utf8" };
  }
}

export function utf8RejectMessage(reason: Utf8ValidationResult extends { ok: false; reason: infer R } ? R : never) {
  switch (reason) {
    case "utf16":
      return "Detected UTF-16. Please re-save the file as UTF-8 and upload again.";
    case "empty":
      return "File has no usable text content.";
    case "replacement":
    case "invalid_utf8":
    default:
      return "File is not valid UTF-8. Please re-save as UTF-8 (VS Code / Notepad) and retry.";
  }
}
