/**
 * Enforces the YouSee design rule: no emoji, sparkle, star, pin or icon-font glyph
 * may be rendered anywhere in the product. Run in CI: node scripts/check-no-glyphs.mjs
 * Colour dots, typography and words are used instead.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src/app", "src/components", "src/lib"];
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(p)) files.push(p);
  }
}
for (const r of roots) walk(r);

const forbidden = (ch) => {
  const n = ch.codePointAt(0);
  return (
    (n >= 0x1f000 && n <= 0x1faff) || // emoji blocks
    (n >= 0x2600 && n <= 0x27bf) || // misc symbols / dingbats (stars, sparkles, arrows)
    (n >= 0x2190 && n <= 0x21ff) || // arrows
    (n >= 0x2b00 && n <= 0x2bff) ||
    n === 0xfe0f || // variation selector
    n === 0x3030
  );
};

let count = 0;
for (const file of files) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    const found = [...new Set([...line].filter(forbidden))];
    if (found.length) {
      console.error(`${file}:${i + 1} disallowed glyph(s): ${found.map((c) => `U+${c.codePointAt(0).toString(16)}`).join(", ")}`);
      count++;
    }
  });
}
if (count) {
  console.error(`\n${count} line(s) contain icon/emoji glyphs. Replace them with a CSS dot, a short text label or plain wording.`);
  process.exit(1);
}
console.log(`No icon or emoji glyphs found in ${files.length} UI source files.`);
