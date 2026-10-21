// apps/finance-tracker-web/tests/qa-theme-runner.mjs
// Verification suite for Couple Design System & Theme Integration

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "../src");
const indexHtmlPath = path.resolve(__dirname, "../index.html");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

function test(name, fn) {
  process.stdout.write(`[THEME TEST] ${name}... `);
  try {
    fn();
    passed++;
    console.log("PASSED");
  } catch (err) {
    failed++;
    console.log("FAILED -> " + err.message);
  }
}

// 1. Theme store verification
test("Theme store defines 4 couple themes and storage sync", () => {
  const themeStoreContent = fs.readFileSync(path.join(srcDir, "stores/theme.store.ts"), "utf-8");
  assert(themeStoreContent.includes('"Sakura"'), "Must include Sakura theme");
  assert(themeStoreContent.includes('"Duo"'), "Must include Duo theme");
  assert(themeStoreContent.includes('"Light"'), "Must include Light theme");
  assert(themeStoreContent.includes('"Dark"'), "Must include Dark theme");
  assert(themeStoreContent.includes('localStorage.getItem("theme")'), "Must read from localStorage 'theme'");
  assert(themeStoreContent.includes('localStorage.setItem("theme"'), "Must write to localStorage 'theme'");
  assert(themeStoreContent.includes('setAttribute("data-theme"'), "Must set data-theme attribute on document root");
  assert(themeStoreContent.includes("toggleNextTheme"), "Must provide toggleNextTheme");
});

// 2. index.html head script verification
test("index.html contains FOUC prevention script and default Sakura theme", () => {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  assert(indexHtml.includes('data-theme="Sakura"'), "Must have data-theme='Sakura' on html tag");
  assert(indexHtml.includes("localStorage.getItem('theme')"), "Must have head script to read stored theme");
});

// 3. Theme switcher components exist
test("ThemeSwitcher components exported", () => {
  const switcherContent = fs.readFileSync(path.join(srcDir, "components/ThemeSwitcher.tsx"), "utf-8");
  assert(switcherContent.includes("export function ThemeSwitcherSection"), "Must export ThemeSwitcherSection");
  assert(switcherContent.includes("export function QuickThemeToggle"), "Must export QuickThemeToggle");
});

// 4. Zero hardcoded teal/rose/emerald classes in UI source
test("Zero hardcoded legacy color utilities across src", () => {
  function scanDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const fullPath = path.join(dir, f.name);
      if (f.isDirectory()) {
        scanDir(fullPath);
      } else if (f.name.endsWith(".tsx") || f.name.endsWith(".ts")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // check for teal-*, rose-*, emerald-*
        const tealMatches = content.match(/\bteal-\d+/g);
        const roseMatches = content.match(/\brose-\d+/g);
        const emeraldMatches = content.match(/\bemerald-\d+/g);

        assert(!tealMatches, `Found teal-* in ${f.name}: ${tealMatches?.join(", ")}`);
        assert(!roseMatches, `Found rose-* in ${f.name}: ${roseMatches?.join(", ")}`);
        assert(!emeraldMatches, `Found emerald-* in ${f.name}: ${emeraldMatches?.join(", ")}`);
      }
    }
  }
  scanDir(srcDir);
});

// 5. Semantic couple tokens and 3D buttons in key routes
test("Key views utilize couple design tokens and 3D buttons", () => {
  const rootContent = fs.readFileSync(path.join(srcDir, "routes/__root.tsx"), "utf-8");
  assert(rootContent.includes("QuickThemeToggle"), "__root.tsx must include QuickThemeToggle");
  assert(rootContent.includes("btn-3d"), "__root.tsx must include btn-3d");
  assert(rootContent.includes("border-border-color"), "__root.tsx must use border-border-color");

  const dashboardContent = fs.readFileSync(path.join(srcDir, "routes/index.tsx"), "utf-8");
  assert(dashboardContent.includes("btn-3d"), "index.tsx must use btn-3d");
  assert(dashboardContent.includes("bg-card-surface"), "index.tsx must use bg-card-surface");

  const settingsContent = fs.readFileSync(path.join(srcDir, "routes/settings.tsx"), "utf-8");
  assert(settingsContent.includes("ThemeSwitcherSection"), "settings.tsx must include ThemeSwitcherSection");
  assert(settingsContent.includes("btn-3d"), "settings.tsx must use btn-3d");

  const chartsContent = fs.readFileSync(path.join(srcDir, "components/FinanceCharts.tsx"), "utf-8");
  assert(chartsContent.includes("var(--primary)"), "FinanceCharts must use var(--primary)");
  assert(chartsContent.includes("var(--card-surface)"), "FinanceCharts must use var(--card-surface)");
});

console.log("=================================================");
console.log(`Theme Suite Results: ${passed} passed, ${failed} failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
