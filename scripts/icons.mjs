// Renders the GM monogram (defined once in app.html) into home screen icons and a manifest per theme.
// Run: node scripts/icons.mjs   (needs Playwright; outputs icon-<size>[-<theme>].png and manifest-<theme>.webmanifest)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const src = readFileSync(new URL("../app.html", import.meta.url), "utf8");
const code = src.slice(src.indexOf("/*MARK*/"), src.indexOf("/*/MARK*/"));
const { MARKS, markSvg } = new Function(code + "; return { MARKS, markSvg };")();
const base = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
const canvas = { greatestme: "#0D0820", synthwave: "#020B14", martin: "#FFF1D6", studio: "#F2F4F7", coastal: "#EEF8F9", midnight: "#060A18", differentworld: "#561424", heritage: "#0B0A08", pumpkin: "#FBF0E2", christmas: "#071A12", matrix: "#000300", freshprince: "#F4D6EE", livingsingle: "#F7EBDD", chicago: "#F6F2F2", atlanta: "#F7F4F0" };
const browser = await chromium.launch(); const page = await browser.newPage();
for (const suite of Object.keys(MARKS)) {
  for (const size of [180, 192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${markSvg(suite, true)}`);
    const png = await page.screenshot({ omitBackground: false });
    writeFileSync(new URL(`../icon-${size}-${suite}.png`, import.meta.url), png);
    if (suite === "greatestme") writeFileSync(new URL(`../icon-${size}.png`, import.meta.url), png);
  }
  const m = { ...base, background_color: canvas[suite], theme_color: canvas[suite], icons: [
    { src: `icon-192-${suite}.png`, sizes: "192x192", type: "image/png" },
    { src: `icon-512-${suite}.png`, sizes: "512x512", type: "image/png" },
    { src: `icon-512-${suite}.png`, sizes: "512x512", type: "image/png", purpose: "maskable" }] };
  writeFileSync(new URL(`../manifest-${suite}.webmanifest`, import.meta.url), JSON.stringify(m, null, 2) + "\n");
  if (suite === "greatestme") writeFileSync(new URL(`../manifest.webmanifest`, import.meta.url), JSON.stringify({ ...m, icons: m.icons.map(i => ({ ...i, src: i.src.replace("-greatestme", "") })) }, null, 2) + "\n");
}
writeFileSync(new URL("../icon.svg", import.meta.url), markSvg("greatestme") + "\n");
await browser.close(); console.log("icons written");
