#!/usr/bin/env node
// Verifies preview routes in a real browser session, including hydration/runtime failures.
// Usage: node scripts/review/preview-smoke.mjs

import { chromium } from "playwright";
import { previewRoutes } from "./preview-routes.mjs";

const BASE = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:3100";

async function main() {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });

    const page = await context.newPage();
    let ok = 0;
    let fail = 0;
    const failures = [];

    for (const route of previewRoutes) {
      const url = `${BASE}${route}`;
      const consoleErrors = [];
      const pageErrors = [];

      const consoleHandler = (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      };
      const pageErrorHandler = (error) => {
        pageErrors.push(error.message);
      };

      page.on("console", consoleHandler);
      page.on("pageerror", pageErrorHandler);

      try {
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });

        if (!response?.ok()) {
          throw new Error(`HTTP ${response?.status() ?? "unknown"}`);
        }

        if (pageErrors.length > 0) {
          throw new Error(`Page error: ${pageErrors[0]}`);
        }

        if (consoleErrors.length > 0) {
          throw new Error(`Console error: ${consoleErrors[0]}`);
        }

        console.log(`OK  ${route}`);
        ok += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`ERR ${route}: ${message}`);
        failures.push({ route, message });
        fail += 1;
      } finally {
        page.off("console", consoleHandler);
        page.off("pageerror", pageErrorHandler);
      }
    }

    console.log(`\nPreview smoke complete: ${ok} ok, ${fail} failed`);

    if (failures.length > 0) {
      console.log("\nFehlgeschlagene Routen:");
      for (const failure of failures) {
        console.log(`- ${failure.route}: ${failure.message}`);
      }
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

await main();
