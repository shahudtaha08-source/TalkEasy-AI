#!/usr/bin/env node
/**
 * TalkEasy v6.3.0 — generate the PWA / launcher PNG icons from the shipped
 * TalkEasy brand mark (`client/public/favicon.svg`).
 *
 * Android Chrome requires real raster 192 px and 512 px icons (plus a maskable
 * 512 px icon) for the install prompt; an SVG-only manifest is not installable
 * on all Android Chrome builds. This renders the existing brand mark on the
 * TalkEasy light background with headless Chrome, so the icons match the app
 * branding exactly — no generic placeholder artwork.
 *
 * All work happens on the repo volume (temp files under ./tmp). No downloads.
 *
 * Run:  node scripts/generate-pwa-icons.mjs
 *       CHROME_PATH="/path/to/chrome" node scripts/generate-pwa-icons.mjs
 */
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "client", "public", "favicon.svg");
const outDir = path.join(root, "client", "public", "icons");
const tmpDir = path.join(root, "tmp", "pwa-icons");

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c)) || null;
}

function page(svg, scalePercent) {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #ffffff; }
  #bg { position: fixed; inset: 0; background: radial-gradient(115% 115% at 32% 22%, #dffffb 0%, #eef8ff 46%, #ffffff 100%); }
  #logo { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: ${scalePercent}%; height: ${scalePercent}%; }
  #logo svg { width: 100%; height: 100%; display: block; }
</style></head><body><div id="bg"></div><div id="logo">${svg}</div></body></html>`;
}

function shoot(chrome, htmlPath, size, outPath) {
  const res = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${size},${size}`,
      `--screenshot=${outPath}`,
      `file:///${htmlPath.replace(/\\/g, "/")}`,
    ],
    { stdio: "ignore" },
  );
  if (res.error) throw res.error;
  if (!existsSync(outPath)) throw new Error(`Chrome did not write ${outPath}`);
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    throw new Error(
      "No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser to regenerate icons.",
    );
  }

  const svg = await readFile(svgPath, "utf-8");
  await mkdir(outDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });

  const anyHtml = path.join(tmpDir, "any.html");
  const maskableHtml = path.join(tmpDir, "maskable.html");
  await writeFile(anyHtml, page(svg, 78), "utf-8");
  await writeFile(maskableHtml, page(svg, 60), "utf-8");

  const jobs = [
    { html: anyHtml, size: 192, out: path.join(outDir, "icon-192.png") },
    { html: anyHtml, size: 512, out: path.join(outDir, "icon-512.png") },
    { html: maskableHtml, size: 512, out: path.join(outDir, "icon-maskable-512.png") },
    { html: anyHtml, size: 180, out: path.join(outDir, "apple-touch-icon.png") },
  ];

  for (const job of jobs) {
    shoot(chrome, job.html, job.size, job.out);
    console.log(`wrote ${path.relative(root, job.out)} (${job.size}x${job.size})`);
  }

  await rm(tmpDir, { recursive: true, force: true });
  console.log("PWA icons generated with", chrome);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
