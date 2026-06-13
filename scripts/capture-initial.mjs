// Dev-only helper: captures the initial load view (no interaction) to verify
// the default focus. Usage: node scripts/capture-initial.mjs [outFile]
import { chromium } from "playwright";

const outFile = process.argv[2] ?? "shots-initial.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:5173/Solar-System-Simulation/", {
  waitUntil: "networkidle"
});
await page.waitForSelector(".focus-button");
await page.waitForTimeout(2500);
const pressed = await page.$eval(
  '.focus-button[aria-pressed="true"]',
  (el) => el.textContent?.trim()
);
console.log(`focused button: ${pressed}`);
await page.screenshot({ path: outFile });
console.log(`captured ${outFile}`);

await browser.close();
