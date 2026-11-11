import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildClonedBlockRows, groupBlocksByStep, legacyTextBlocksToRows, serializeCanvasBlocks } from "../lib/editor/document.ts";

test("loads canonical rows with their stable database IDs and order", () => {
  const document = groupBlocksByStep(["step-a", "step-empty"], [
    { id: "block-b", step_id: "step-a", position: 1, block_type: "Texto", content: { content: "B", fontSize: 20 } },
    { id: "block-a", step_id: "step-a", position: 0, block_type: "Texto", content: { content: "A" } },
  ]);
  assert.deepEqual(document["step-a"].map(({ blockId, content }) => [blockId, content]), [["block-a", "A"], ["block-b", "B"]]);
  assert.deepEqual(document["step-empty"], []);
});

test("serializes a canvas snapshot without its transient local IDs", () => {
  assert.deepEqual(serializeCanvasBlocks("step-a", [
    { id: 99, blockId: "stable-id", item: "Texto", content: "Texto", fontSize: 18 },
    { id: 100, item: "Imagem", content: "", imageUrl: "https://example.test/image.png" },
  ]), [
    { id: "stable-id", step_id: "step-a", position: 0, block_type: "Texto", content: { content: "Texto", fontSize: 18 } },
    { id: undefined, step_id: "step-a", position: 1, block_type: "Imagem", content: { content: "", imageUrl: "https://example.test/image.png" } },
  ]);
});

test("prepares cloned blocks with new step IDs, original order, and full properties", () => {
  assert.deepEqual(buildClonedBlockRows("new-step", [
    { position: 4, block_type: "Botão", content: { content: "Continuar", style: "primary", navigation: { type: "next" } } },
    { position: 1, block_type: "Imagem", content: { content: "", imageUrl: "https://example.test/image.png", width: 75 } },
  ]), [
    { step_id: "new-step", position: 0, block_type: "Imagem", content: { content: "", imageUrl: "https://example.test/image.png", width: 75 } },
    { step_id: "new-step", position: 1, block_type: "Botão", content: { content: "Continuar", style: "primary", navigation: { type: "next" } } },
  ]);
});

test("converts legacy text blocks in order while keeping their content and properties", () => {
  assert.deepEqual(legacyTextBlocksToRows("step-a", [
    { role: "heading", type: "text", content: "Título", bold: true },
    { role: "paragraph", type: "text", content: "Mensagem", fontSize: 18 },
    { role: "image", type: "image", content: "ignored" },
    { role: "empty", type: "text", content: 12 },
    null,
  ], 4), [
    { step_id: "step-a", position: 4, block_type: "Texto", content: { role: "heading", bold: true, content: "Título" } },
    { step_id: "step-a", position: 5, block_type: "Texto", content: { role: "paragraph", fontSize: 18, content: "Mensagem" } },
  ]);
  assert.deepEqual(legacyTextBlocksToRows("step-a", null, 0), []);
});

test("migration backs up the legacy JSON, appends canonical text, and is rerun-safe", () => {
  const sql = readFileSync(new URL("../supabase/migrations/0007_unify_step_blocks.sql", import.meta.url), "utf8");
  assert.ok(sql.indexOf("insert into private.step_text_blocks_legacy_backup") < sql.indexOf("update public.funnel_steps"));
  assert.match(sql, /not exists\s*\(\s*select 1 from private\.step_text_blocks_legacy_backup/i);
  assert.match(sql, /select coalesce\(max\(position\) \+ 1, 0\)/i);
  assert.match(sql, /create or replace function public\.sync_step_blocks/i);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.step_blocks\s+where\s+step_id/i);
});
