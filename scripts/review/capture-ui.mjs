#!/usr/bin/env node
// Captures UI screenshots of preview routes via Playwright.
// Usage: node scripts/review/capture-ui.mjs [--out docs/ui-review/before]

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { previewShots } from "./preview-routes.mjs";

const BASE = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:3100";
const OUT_ARG_IDX = process.argv.indexOf("--out");
const OUT = path.resolve(
  OUT_ARG_IDX >= 0 ? process.argv[OUT_ARG_IDX + 1] : "docs/ui-review/before",
);

const VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const page = await context.newPage();
    // warm up
    await page.goto(`${BASE}/preview`, { waitUntil: "networkidle", timeout: 30_000 });

    let ok = 0;
    let fail = 0;
    for (const shot of previewShots) {
      const url = `${BASE}/preview/${shot.screen}/${shot.variant}`;
      const out = path.join(OUT, `${shot.screen}--${shot.variant}.png`);
      try {
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
        if (!response?.ok()) {
          throw new Error(`HTTP ${response?.status() ?? "unknown"}`);
        }
        // small wait to let animations / data settle
        await page.waitForTimeout(250);
        await page.screenshot({ path: out, fullPage: true });
        console.log(`OK  ${shot.screen}/${shot.variant} -> ${out}`);
        ok += 1;
      } catch (err) {
        console.log(`ERR ${shot.screen}/${shot.variant}: ${err.message}`);
        fail += 1;
      }
    }
    console.log(`\nTotal: ${ok} ok, ${fail} failed`);
    if (fail > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

await main();
