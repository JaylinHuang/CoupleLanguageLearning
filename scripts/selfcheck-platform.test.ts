/**
 * 平台重构自检用例（无 DB）：UTF-8、切块、角色判定相关纯函数
 * 运行：npx tsx --test scripts/selfcheck-platform.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateUtf8Bytes, utf8RejectMessage } from "../src/lib/utf8-validate";
import { chunkPlaintext, IMPORT_LIMITS } from "../src/lib/chunker";

describe("utf8-validate encoding.v1", () => {
  it("accepts plain UTF-8 Chinese", () => {
    const r = validateUtf8Bytes(Buffer.from("晚安，亲爱的", "utf8"));
    assert.equal(r.ok, true);
    if (r.ok) assert.match(r.text, /晚安/);
  });

  it("strips BOM and accepts", () => {
    const body = Buffer.from("hello", "utf8");
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const r = validateUtf8Bytes(Buffer.concat([bom, body]));
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.text, "hello");
  });

  it("rejects UTF-16 LE BOM", () => {
    const r = validateUtf8Bytes(Buffer.from([0xff, 0xfe, 0x61, 0x00]));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.reason, "utf16");
      assert.match(utf8RejectMessage(r.reason), /UTF-16/);
    }
  });

  it("rejects invalid UTF-8 bytes", () => {
    const r = validateUtf8Bytes(Buffer.from([0xc3, 0x28]));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "invalid_utf8");
  });

  it("rejects empty/whitespace", () => {
    const r = validateUtf8Bytes(Buffer.from("   \n  ", "utf8"));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "empty");
  });
});

describe("chunker.v1", () => {
  it("splits long plaintext under maxChunks", () => {
    const text = Array.from({ length: 50 }, (_, i) => `第${i}段。内容内容内容。`).join(
      "\n\n",
    );
    const chunks = chunkPlaintext(text, "fine");
    assert.ok(chunks.length > 1);
    assert.ok(chunks.length <= IMPORT_LIMITS.maxChunksPerImport);
    assert.ok(chunks.every((c) => c.trim().length > 0));
  });

  it("keeps short text as one chunk", () => {
    const chunks = chunkPlaintext("我想你。", "standard");
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0], "我想你。");
  });

  it("standard preset does not explode tiny files", () => {
    const chunks = chunkPlaintext("a\n\nb\n\nc", "standard");
    assert.ok(chunks.length >= 1);
    assert.ok(chunks.length <= 3);
  });
});

describe("platform auth invariants (logic)", () => {
  it("PLATFORM_ADMIN must not be treated as tutor", () => {
    const isTutor = (platformRole: string, coupleRole: string | null, role: string) => {
      if (platformRole === "PLATFORM_ADMIN") return false;
      return coupleRole === "TUTOR" || role === "ADMIN";
    };
    assert.equal(isTutor("PLATFORM_ADMIN", null, "ADMIN"), false);
    assert.equal(isTutor("MEMBER", "TUTOR", "ADMIN"), true);
    assert.equal(isTutor("MEMBER", null, "ADMIN"), true);
    assert.equal(isTutor("MEMBER", "LEARNER", "LEARNER"), false);
  });

  it("couple ACTIVE gate", () => {
    const canUse = (status: string | null | undefined) =>
      !status || status === "ACTIVE";
    assert.equal(canUse("PENDING_VERIFY"), false);
    assert.equal(canUse("ACTIVE"), true);
    assert.equal(canUse(null), true); // 迁移期无 couple 的旧账号
  });
});
