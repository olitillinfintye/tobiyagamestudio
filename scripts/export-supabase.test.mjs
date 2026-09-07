import { test } from "node:test";
import assert from "node:assert/strict";
import { storagePath, checksum } from "./export-supabase.mjs";

test("storage paths retain bucket and filename", () => {
  assert.equal(storagePath("https://example.supabase.co/storage/v1/object/public/project-images/photo%20one.png", "https://example.supabase.co"), "project-images/photo one.png");
});
test("storage paths reject traversal and foreign origins", () => {
  assert.throws(() => storagePath("https://example.supabase.co/storage/v1/object/public/project-images/%2e%2e%2fconfig.php", "https://example.supabase.co"));
  assert.throws(() => storagePath("https://other.example/storage/v1/object/public/file.png", "https://example.supabase.co"));
});
test("checksums are stable across buffers and text", () => {
  assert.equal(checksum("test"), checksum(Buffer.from("test")));
  assert.notEqual(checksum("test"), checksum("changed"));
});