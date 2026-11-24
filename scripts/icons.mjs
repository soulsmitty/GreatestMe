// Renders the GM monogram (defined once in app.html) into home screen icons and a manifest per theme.
// Run: node scripts/icons.mjs   (needs Playwright; writes icons/icon-<size>-<theme>.png, icons/manifest-<theme>.webmanifest and icons/icon.svg)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const src = readFileSync(new URL("../app.html", import.meta.url), "utf8");
const code = src.slice(src.indexOf("/*MARK*/"), src.indexOf("/*/MARK*/"));
const { MARKS, markSvg } = new Function(code + "; return { MARKS, markSvg };")();
const base = {"name": "GreatestMe", "short_name": "GreatestMe", "description": "A 13-week journal for goals, habits and daily wins.", "start_url": "../#today", "scope": "../", "display": "standalone", "orientation": "any", "shortcuts": [{"name": "Morning page", "url": "../#morning"}, {"name": "Evening review", "url": "../#evening"}, {"name": "Habits", "url": "../#habits"}, {"name": "Write by hand", "url": "../#ink"}]}; // manifests live in icons/, so links reach back to the app with ../
const canvas = { greatestme: "#0D0820", synthwave: "#020B14", martin: "#FFF1D6", studio: "#F2F4F7", coastal: "#EEF8F9", midnight: "#060A18", differentworld: "#561424", heritage: "#0B0A08", pumpkin: "#FBF0E2", christmas: "#071A12", matrix: "#000300", freshprince: "#F4D6EE", livingsingle: "#F7EBDD", chicago: "#F6F2F2", atlanta: "#F7F4F0" };
const browser = await chromium.launch(); const page = await browser.newPage();
for (const suite of Object.keys(MARKS)) {
  for (const size of [180, 192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${markSvg(suite, true)}`);
    const png = await page.screenshot({ omitBackground: false });
    writeFileSync(new URL(`../icons/icon-${size}-${suite}.png`, import.meta.url), png);
  }
  const m = { ...base, background_color: canvas[suite], theme_color: canvas[suite], icons: [
    { src: `icon-192-${suite}.png`, sizes: "192x192", type: "image/png" },
    { src: `icon-512-${suite}.png`, sizes: "512x512", type: "image/png" },
    { src: `icon-512-${suite}.png`, sizes: "512x512", type: "image/png", purpose: "maskable" }] };
  writeFileSync(new URL(`../icons/manifest-${suite}.webmanifest`, import.meta.url), JSON.stringify(m, null, 2) + "\n");
}
writeFileSync(new URL("../icons/icon.svg", import.meta.url), markSvg("greatestme") + "\n");
await browser.close(); console.log("icons written");
