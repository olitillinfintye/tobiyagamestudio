import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const tableNames = ["projects", "team_members", "awards", "blog_posts", "services", "partners", "site_settings", "contact_submissions", "admin_users", "admin_permissions"];
export const checksum = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function storagePath(url, origin) {
  const parsed = new URL(url);
  const prefix = "/storage/v1/object/public/";
  if (parsed.origin !== origin || !parsed.pathname.startsWith(prefix)) throw new Error("Unexpected storage origin or path.");
  const relative = decodeURIComponent(parsed.pathname.slice(prefix.length));
  if (relative.split("/").some((part) => !/^[a-zA-Z0-9_. -]+$/.test(part) || part === "." || part === "..")) throw new Error("Unsafe storage path.");
  return relative;
}

export async function exportSupabase(configFile, destination) {
  const config = JSON.parse(await readFile(configFile, "utf8"));
  const origin = new URL(config.url).origin;
  if (!origin.startsWith("https://") || !config.serviceRoleKey) throw new Error("HTTPS URL and a service-role key are required in the private config.");
  await mkdir(destination, { recursive: false, mode: 0o700 });
  const headers = { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` };
  const api = async (route) => {
    const response = await fetch(origin + route, { headers, redirect: "error" });
    if (!response.ok) throw new Error(`Export request failed (${response.status}). No data was imported.`);
    return response.json();
  };
  const tables = {};
  for (const name of tableNames) {
    const rows = [];
    for (;;) {
      const page = await api(`/rest/v1/${name}?select=*&order=id.asc&limit=500&offset=${rows.length}`);
      if (!Array.isArray(page)) throw new Error("Invalid export response.");
      rows.push(...page);
      if (page.length === 0) break;
    }
    if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error("Source changed during export. Freeze writes and retry.");
    tables[name] = rows;
    console.log(`${name}: ${rows.length} records`);
  }
  const users = [];
  for (const admin of tables.admin_users) {
    const user = await api(`/auth/v1/admin/users/${encodeURIComponent(admin.user_id)}`);
    if (!user.id || !user.email) throw new Error("Admin identity could not be exported.");
    users.push({ id: user.id, email: user.email, created_at: user.created_at });
  }
  const media = {};
  const rewrite = async (value) => {
    if (Array.isArray(value)) return Promise.all(value.map(rewrite));
    if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await rewrite(item)])));
    if (typeof value !== "string") return value;
    if (/^[\[{]/.test(value.trim())) {
      let parsed;
      try { parsed = JSON.parse(value); } catch { parsed = undefined; }
      if (parsed !== undefined) return JSON.stringify(await rewrite(parsed));
    }
    const urls = [...value.matchAll(/https:\/\/[^\s"'<>\\]+/g)].map((match) => match[0]);
    for (const url of urls) {
      if (!url.startsWith(origin + "/storage/")) continue;
      const relative = storagePath(url, origin);
      if (!media[relative]) {
        const response = await fetch(url, { redirect: "error" });
        if (!response.ok) throw new Error(`Media download failed (${response.status}).`);
        const bytes = Buffer.from(await response.arrayBuffer());
        const target = path.join(destination, "uploads", relative);
        await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
        await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
        media[relative] = { sha256: checksum(bytes), bytes: bytes.length };
      }
      value = value.replaceAll(url, "/uploads/" + relative.split("/").map(encodeURIComponent).join("/"));
    }
    if (value.includes(origin + "/storage/")) throw new Error("Unconverted storage reference. Review source content before migration.");
    return value;
  };
  const data = JSON.stringify({ version: 1, tables: await rewrite(tables), users }, null, 2);
  await writeFile(path.join(destination, "data.json"), data, { flag: "wx", mode: 0o600 });
  await writeFile(path.join(destination, "manifest.json"), JSON.stringify({ version: 1, exported_at: new Date().toISOString(), data_sha256: checksum(data), counts: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])), media }, null, 2), { flag: "wx", mode: 0o600 });
  console.log("Export complete. Keep this directory private; it contains messages and admin identities.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4) throw new Error("Usage: node scripts/export-supabase.mjs PRIVATE_CONFIG_PATH NEW_EXPORT_DIRECTORY");
  await exportSupabase(process.argv[2], process.argv[3]);
}