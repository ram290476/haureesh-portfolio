import { GALLERY_CLASSES } from "../assets/lightbox.js";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FOOTER = `<footer>
  <div class="w">
    <p class="fine">© 2026 Haureesh Vellamsetti</p>
  </div>
</footer>`;

export const LIGHTBOX_TAGS = `  <link rel="stylesheet" href="/assets/lightbox.css">
  <script type="module" src="/assets/lightbox.js"></script>`;

const SKIP = new Set(["activities/cello.html", "projects/model-rocket.html"]);
const FOOTER_RE = /<footer\b[\s\S]*?<\/footer>/g;

export function pageHasPhotoGallery(html) {
  const body = html.replace(/<footer\b[\s\S]*?<\/footer>/, "");
  const tokens = new Set();
  for (const match of body.matchAll(/class="([^"]*)"/g)) {
    for (const token of match[1].split(/\s+/)) if (token) tokens.add(token);
  }
  return GALLERY_CLASSES.some((name) => tokens.has(name));
}

export function footerFor(html) {
  if (!pageHasPhotoGallery(html)) return FOOTER;
  return FOOTER.replace("</footer>", `${LIGHTBOX_TAGS}\n</footer>`);
}

export function siteRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

export function htmlPages(root = siteRoot()) {
  const pages = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".html")) {
        const rel = relative(root, full).split("\\").join("/");
        if (!SKIP.has(rel)) pages.push(rel);
      }
    }
  }
  walk(root);
  return pages.sort();
}

export function footerProblems(root = siteRoot()) {
  const problems = [];
  for (const rel of htmlPages(root)) {
    const html = readFileSync(join(root, rel), "utf8");
    const found = html.match(FOOTER_RE) || [];
    if (found.length !== 1) problems.push(`${rel}: expected 1 footer, found ${found.length}`);
    else if (found[0] !== footerFor(html)) problems.push(`${rel}: footer does not match the reference`);
  }
  return problems;
}

function withFooter(html) {
  const stripped = html.replace(FOOTER_RE, "");
  if (!stripped.includes("</body>")) throw new Error("page has no </body>");
  return stripped.replace(/\s*<\/body>/, `\n${footerFor(stripped)}\n</body>`);
}

function writeFooters(root) {
  for (const rel of htmlPages(root)) {
    const full = join(root, rel);
    const html = readFileSync(full, "utf8");
    const next = withFooter(html);
    if (next !== html) writeFileSync(full, next);
  }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] || "")).href) {
  const root = siteRoot();
  if (process.argv.includes("--write")) writeFooters(root);
  const problems = footerProblems(root);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`footer ok on ${htmlPages(root).length} pages`);
}
