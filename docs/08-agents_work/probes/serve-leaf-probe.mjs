/**
 * Static server for the leaf-shape probe. Run it, leave it running, then
 * run shoot-leaf-probe.mjs in another shell (or let the shoot script
 * start it).
 *
 *   node docs/08-agents_work/probes/serve-leaf-probe.mjs
 *   node docs/08-agents_work/probes/shoot-leaf-probe.mjs
 *
 * The root is the MAIN repository's apps/web/public — real photographs
 * live only there (gitignored). Port 4601 avoids collision with the
 * orientation probe server on 4599.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAIN_REPO = execSync("git worktree list", { cwd: HERE })
  .toString()
  .split("\n")[0]
  .split(" ")[0];
const ROOT = join(MAIN_REPO, "apps/web/public");
const REMAP = {
  "/leaf-shape-probe.html": resolve(HERE, "leaf-shape-probe.html"),
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".mjs": "text/javascript",
};

createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = REMAP[p] ?? join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ""));
  try {
    if (!(await stat(file)).isFile()) throw new Error("not a file");
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end(`404 ${p}`);
  }
}).listen(4601, "127.0.0.1", () => {
  console.log(`leaf-shape probe server on http://127.0.0.1:4601  (root ${ROOT})`);
});
