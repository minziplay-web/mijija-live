#!/usr/bin/env node
// Snapshots of the new one-question-per-page Daily flow.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:3100";
const OUT = path.resolve("docs/ui-review/after/daily-steps");
const VIEWPORT = { width: 390, height: 844 };

const STEPS = [
  {
    name: "01-step-1-unanswered",
    variant: "normal",
    // mockDaily starts with card 0 revealed, card 1 waiting, 2-4 unanswered.
    // initialIndex will be 2 (first open). Show that.
    actions: [],
  },
  {
    name: "02-step-1-back-to-start",
    variant: "normal",
    actions: [
      async (page) => {
        await page.click('button[aria-label="Vorherige Frage"]');
        await page.click('button[aria-label="Vorherige Frage"]');
      },
    ],
  },
  {
    name: "03-step-answered-submitting",
    variant: "normal",
    actions: [
      async (page) => {
        // click a "duel_1v1" side
        const lefts = await page.$$('button:has-text("Leon")');
        if (lefts.length > 0) await lefts[0].click();
        const submit = await page.$('button:has-text("Antwort abschicken")');
        if (submit) await submit.click();
        await page.waitForTimeout(600);
      },
    ],
  },
  {
    name: "04-step-advance-to-next",
    variant: "normal",
    actions: [
      async (page) => {
        const lefts = await page.$$('button:has-text("Leon")');
        if (lefts.length > 0) await lefts[0].click();
        await page.click('button:has-text("Antwort abschicken")');
        await page.waitForTimeout(600);
        await page.click('button:has-text("Naechste Frage")');
        await page.waitForTimeout(400);
      },
    ],
  },
  {
    name: "05-completion-card",
    variant: "normal",
    actions: [
      async (page) => {
        // Cycle through remaining unanswered (duel_1v1, either_or, duel_2v2)
        for (let i = 0; i < 5; i++) {
          const label = await page.$(
            'button:has-text("Antwort abschicken"), button:has-text("Naechste Frage"), button:has-text("Daily abschließen")',
          );
          if (!label) break;
          // If current is unanswered, click first selectable button (first button inside input area).
          const submit = await page.$('button:has-text("Antwort abschicken"):not([disabled])');
          if (submit) {
            const any = await page.$$('section[class*="radius-card"] button[type="button"]:not([aria-label]):not([aria-label*="Frage"])');
            if (any.length > 0) {
              await any[0].click();
            }
            await page.waitForTimeout(100);
            const submitNow = await page.$('button:has-text("Antwort abschicken"):not([disabled])');
            if (submitNow) {
              await submitNow.click();
              await page.waitForTimeout(600);
            }
          }
          const next = await page.$('button:has-text("Naechste Frage"):not([disabled])');
          const finish = await page.$('button:has-text("Daily abschließen"):not([disabled])');
          if (finish) {
            await finish.click();
            await page.waitForTimeout(400);
            break;
          }
          if (next) {
            await next.click();
            await page.waitForTimeout(400);
          }
        }
      },
    ],
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const step of STEPS) {
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      const url = `${BASE}/preview/daily/${step.variant}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      for (const action of step.actions) {
        await action(page);
      }
      const out = path.join(OUT, `${step.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`OK ${step.name} -> ${out}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

await main();
