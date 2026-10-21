// apps/finance-tracker-web/tests/qa-ui-components-runner.mjs
// Verification suite for @repo/ui Component Harmonization across finance-tracker-web and habbit-tracker-web

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const repoUiDir = path.resolve(repoRoot, "packages/ui/src");
const financeWebDir = path.resolve(repoRoot, "apps/finance-tracker-web/src");
const habbitWebDir = path.resolve(repoRoot, "apps/habbit-tracker-web/src");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

function test(name, fn) {
  process.stdout.write(`[UI TEST] ${name}... `);
  try {
    fn();
    passed++;
    console.log("PASSED");
  } catch (err) {
    failed++;
    console.log("FAILED -> " + err.message);
  }
}

console.log("==================================================================");
console.log("Running QA Automated Verification for UI Component Harmonization");
console.log("==================================================================");

// 1. @repo/ui Components & Exports
test("PB-1: @repo/ui button includes destructive variant", () => {
  const content = fs.readFileSync(path.join(repoUiDir, "components/button.tsx"), "utf-8");
  assert(content.includes("destructive:"), "Must include destructive variant in buttonVariants");
  assert(content.includes("bg-red-500"), "Destructive variant must style background with red-500");
});

test("PB-1: @repo/ui exports Input component with forwardRef", () => {
  const content = fs.readFileSync(path.join(repoUiDir, "components/input.tsx"), "utf-8");
  assert(content.includes("export interface InputProps"), "Must export InputProps");
  assert(content.includes("const Input = React.forwardRef"), "Input must use React.forwardRef");
  assert(content.includes("export { Input }"), "Must export Input");
});

test("PB-1: @repo/ui exports Select component with ChevronDown", () => {
  const content = fs.readFileSync(path.join(repoUiDir, "components/select.tsx"), "utf-8");
  assert(content.includes("export interface SelectProps"), "Must export SelectProps");
  assert(content.includes("const Select = React.forwardRef"), "Select must use React.forwardRef");
  assert(content.includes("ChevronDown"), "Select must include ChevronDown icon");
  assert(content.includes("export { Select }"), "Must export Select");
});

test("PB-1: @repo/ui exports Textarea component with forwardRef", () => {
  const content = fs.readFileSync(path.join(repoUiDir, "components/textarea.tsx"), "utf-8");
  assert(content.includes("export interface TextareaProps"), "Must export TextareaProps");
  assert(content.includes("const Textarea = React.forwardRef"), "Textarea must use React.forwardRef");
  assert(content.includes("export { Textarea }"), "Must export Textarea");
});

test("PB-1: @repo/ui index.ts exports all components", () => {
  const content = fs.readFileSync(path.join(repoUiDir, "index.ts"), "utf-8");
  assert(content.includes('"./components/button"'), "Must export button");
  assert(content.includes('"./components/card"'), "Must export card");
  assert(content.includes('"./components/dialog"'), "Must export dialog");
  assert(content.includes('"./components/input"'), "Must export input");
  assert(content.includes('"./components/select"'), "Must export select");
  assert(content.includes('"./components/textarea"'), "Must export textarea");
});

// 2. habbit-tracker-web Re-exports
test("PB-2: habbit-tracker-web re-exports Input from @repo/ui", () => {
  const content = fs.readFileSync(path.join(habbitWebDir, "components/ui/input.tsx"), "utf-8");
  assert(content.includes('from "@repo/ui"'), "Must re-export from @repo/ui");
  assert(content.includes("Input"), "Must export Input");
});

test("PB-2: habbit-tracker-web re-exports Select from @repo/ui", () => {
  const content = fs.readFileSync(path.join(habbitWebDir, "components/ui/select.tsx"), "utf-8");
  assert(content.includes('from "@repo/ui"'), "Must re-export from @repo/ui");
  assert(content.includes("Select"), "Must export Select");
});

test("PB-2: habbit-tracker-web re-exports Textarea from @repo/ui", () => {
  const content = fs.readFileSync(path.join(habbitWebDir, "components/ui/textarea.tsx"), "utf-8");
  assert(content.includes('from "@repo/ui"'), "Must re-export from @repo/ui");
  assert(content.includes("Textarea"), "Must export Textarea");
});

// 3. finance-tracker-web UI Folder Wrapper
test("PB-3: finance-tracker-web ui folder provides wrappers for all primitives", () => {
  const uiDir = path.join(financeWebDir, "components/ui");
  const files = ["button.tsx", "dialog.tsx", "card.tsx", "input.tsx", "select.tsx", "textarea.tsx", "index.ts"];
  for (const f of files) {
    assert(fs.existsSync(path.join(uiDir, f)), `File ${f} must exist in components/ui`);
    const content = fs.readFileSync(path.join(uiDir, f), "utf-8");
    if (f !== "index.ts") {
      assert(content.includes('@repo/ui'), `${f} must re-export from @repo/ui`);
    }
  }
});

// 4. Modal Dialog Refactors
test("PB-4: Dedicated Create Transaction Route uses Button, Input, Select, Textarea from @repo/ui without modal overlay", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/transactions_.create.tsx"), "utf-8");
  assert(content.includes("<Button"), "Must render Button");
  assert(content.includes("<Input"), "Must render Input");
  assert(content.includes("<Select"), "Must render Select");
  assert(content.includes("<Textarea"), "Must render Textarea");
  assert(content.includes("<Card"), "Must render Card");
  assert(!content.includes("<Dialog"), "Must not use modal Dialog overlay");
});

test("PB-4: DeleteCategoryDialog uses Dialog and Button variant destructive", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "components/DeleteCategoryDialog.tsx"), "utf-8");
  assert(content.includes("<Dialog"), "Must render Dialog");
  assert(content.includes("<DialogContent"), "Must render DialogContent");
  assert(content.includes('variant="destructive"'), "Must use destructive button variant");
  assert(content.includes("<Select"), "Must render Select");
  assert(!content.includes("fixed inset-0 z-50"), "Must not use raw fixed overlay");
});

test("PB-4: budget.tsx uses Dialog for budget configuration and zero raw modal overlays", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/budget.tsx"), "utf-8");
  assert(content.includes("<Dialog"), "Must render Dialog");
  assert(content.includes("<DialogContent"), "Must render DialogContent");
  assert(content.includes("<Input"), "Must render Input");
  assert(content.includes("<Select"), "Must render Select");
  assert(content.includes("<Button"), "Must render Button");
  assert(!content.includes("fixed inset-0 z-50"), "Must not use raw fixed overlay");
});

test("PB-4: net-worth.tsx uses Dialog for Asset and Liability modals and zero raw modal overlays", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/net-worth.tsx"), "utf-8");
  assert(content.includes("<Dialog"), "Must render Dialog");
  assert(content.includes("<DialogContent"), "Must render DialogContent");
  assert(content.includes("<Input"), "Must render Input");
  assert(content.includes("<Select"), "Must render Select");
  assert(content.includes("<Button"), "Must render Button");
  assert(!content.includes("fixed inset-0 z-50"), "Must not use raw fixed overlay");
});

// 5. Pages & Components Refactors
test("PB-5: transactions.tsx adopts Button, Input, Select, and Card", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/transactions.tsx"), "utf-8");
  assert(content.includes("<Button"), "Must render Button");
  assert(content.includes("<Input"), "Must render Input");
  assert(content.includes("<Select"), "Must render Select");
  assert(content.includes("<Card"), "Must render Card");
});

test("PB-5: BudgetCard.tsx adopts Card and Button", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "components/BudgetCard.tsx"), "utf-8");
  assert(content.includes("<Card"), "Must render Card");
  assert(content.includes("<Button"), "Must render Button");
});

test("PB-5: budget.tsx adopts Card and Button", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/budget.tsx"), "utf-8");
  assert(content.includes("<Card"), "Must render Card");
  assert(content.includes("<Button"), "Must render Button");
});

test("PB-5: net-worth.tsx adopts Card and Button", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/net-worth.tsx"), "utf-8");
  assert(content.includes("<Card"), "Must render Card");
  assert(content.includes("<Button"), "Must render Button");
});

test("PB-5: settings.tsx adopts Card, Input, and Button", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/settings.tsx"), "utf-8");
  assert(content.includes("<Card"), "Must render Card");
  assert(content.includes("<Input"), "Must render Input");
  assert(content.includes("<Button"), "Must render Button");
});

test("PB-5: reports.tsx adopts Card and Button", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/reports.tsx"), "utf-8");
  assert(content.includes("<Card"), "Must render Card");
  assert(content.includes("<Button"), "Must render Button");
});

test("PB-5: index.tsx adopts Card and Button", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "routes/index.tsx"), "utf-8");
  assert(content.includes("<Card"), "Must render Card");
  assert(content.includes("<Button"), "Must render Button");
});

test("PB-5: __root.tsx and ThemeSwitcher.tsx adopt Button and Card", () => {
  const rootContent = fs.readFileSync(path.join(financeWebDir, "routes/__root.tsx"), "utf-8");
  const switcherContent = fs.readFileSync(path.join(financeWebDir, "components/ThemeSwitcher.tsx"), "utf-8");
  assert(rootContent.includes("<Button"), "__root must render Button");
  assert(switcherContent.includes("<Card"), "ThemeSwitcher must render Card");
  assert(switcherContent.includes("<Button"), "ThemeSwitcher must render Button");
});

console.log("------------------------------------------------------------------");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("------------------------------------------------------------------");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All UI component harmonization checks PASSED successfully!");
}
