// Dev-only helper: captures focus-view screenshots of every body through
// headless Chromium. Usage: node scripts/capture-planets.mjs [outDir]
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

// Button order matches the Focus grid in src/ui/controls.ts.
const targets = [
  { name: "sun", button: 2 },
  { name: "mercury", button: 3 },
  { name: "venus", button: 4 },
  { name: "earth", button: 5 },
  { name: "mars", button: 6 },
  { name: "jupiter", button: 7 },
  { name: "saturn", button: 8 },
  { name: "uranus", button: 9 },
  { name: "neptune", button: 10 },
  { name: "overview", button: 1 }
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 }
});
await page.goto("http://127.0.0.1:5173/Solar-System-Simulation/", {
  waitUntil: "networkidle"
});
await page.waitForSelector(".focus-button");
await page.waitForTimeout(2000);

for (const target of targets) {
  await page.click(`.focus-grid .focus-button:nth-child(${target.button})`);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${outDir}/${target.name}.png` });
  console.log(`captured ${target.name}`);
}

await browser.close();
