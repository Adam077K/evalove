/**
 * Static server for the orientation probe. Run it, leave it running, then
 * run shoot-orientation-probe.mjs in another shell.
 *
 *   node docs/08-agents_work/probes/serve-probe.mjs
 *   node docs/08-agents_work/probes/shoot-orientation-probe.mjs
 *   node docs/08-agents_work/probes/shoot-orientation-probe.mjs --lie   # must fail
 *
 * The root is the MAIN repository's apps/web/public, not this worktree's.
 * The 46 real photographs are gitignored, so they exist only there, and a
 * probe served from a worktree copy would render 404s where the
 * photographs go - which is how a screen got judged blind once already.
 * One path is remapped: the probe HTML itself, which lives under docs/.
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
  "/design-probe-orient.html": resolve(HERE, "orientation-probe.html"),
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
}).listen(4599, "127.0.0.1", () => {
  console.log(`probe server on http://127.0.0.1:4599  (root ${ROOT})`);
});
