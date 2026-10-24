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

test("PB-1: @repo/ui exports shadcn-style Select compound built on Radix", () => {
  const content = fs.readFileSync(path.join(repoUiDir, "components/select.tsx"), "utf-8");
  assert(content.includes('from "radix-ui"'), "Select must be built on radix-ui primitives");
  assert(content.includes("SelectPrimitive.Trigger"), "Select must render Radix Trigger");
  assert(content.includes("SelectPrimitive.Content"), "Select must render Radix Content");
  assert(content.includes("SelectPrimitive.Item"), "Select must render Radix Item");
  assert(content.includes("ChevronDown"), "Select must include ChevronDown icon");
  for (const name of ["SelectTrigger", "SelectContent", "SelectItem", "SelectValue"]) {
    assert(content.includes(name), `Must export ${name}`);
  }
  assert(!content.includes("<select"), "Must not render a native <select> element");
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

test("PB-Sidebar: shared Sidebar component exists in @repo/ui and is exported", () => {
  const sidebarPath = path.join(repoUiDir, "components/sidebar.tsx");
  assert(fs.existsSync(sidebarPath), "packages/ui/src/components/sidebar.tsx must exist");
  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
  assert(sidebarContent.includes("export function Sidebar"), "sidebar.tsx must export Sidebar");
  assert(sidebarContent.includes("export interface SidebarItem"), "sidebar.tsx must export SidebarItem");
  assert(sidebarContent.includes("export function isSidebarItemActive"), "sidebar.tsx must export isSidebarItemActive");
  const indexContent = fs.readFileSync(path.join(repoUiDir, "index.ts"), "utf-8");
  assert(indexContent.includes('"./components/sidebar"'), "@repo/ui index must re-export sidebar");
});

test("PB-Sidebar: Sidebar stays router-agnostic (no TanStack Router import)", () => {
  const sidebarContent = fs.readFileSync(path.join(repoUiDir, "components/sidebar.tsx"), "utf-8");
  assert(!sidebarContent.includes("@tanstack/react-router"), "sidebar.tsx must not import @tanstack/react-router");
  assert(sidebarContent.includes("linkComponent"), "sidebar.tsx must accept an injected linkComponent");
});

test("PB-Sidebar: both apps re-export Sidebar from components/ui", () => {
  for (const [label, dir] of [["habbit", habbitWebDir], ["finance", financeWebDir]]) {
    const wrapperPath = path.join(dir, "components/ui/sidebar.tsx");
    assert(fs.existsSync(wrapperPath), `${label} app must have components/ui/sidebar.tsx`);
    const wrapperContent = fs.readFileSync(wrapperPath, "utf-8");
    assert(wrapperContent.includes("Sidebar"), `${label} wrapper must export Sidebar`);
    assert(wrapperContent.includes("@repo/ui"), `${label} wrapper must re-export from @repo/ui`);
  }
});

test("PB-Sidebar: neither __root.tsx keeps an inline <aside> sidebar", () => {
  for (const [label, dir] of [["habbit", habbitWebDir], ["finance", financeWebDir]]) {
    const content = fs.readFileSync(path.join(dir, "routes/__root.tsx"), "utf-8");
    assert(!content.includes("<aside"), `${label} __root.tsx must not render an inline <aside>`);
    assert(content.includes("<Sidebar"), `${label} __root.tsx must render <Sidebar>`);
    assert(
      content.includes('from "../components/ui/sidebar"'),
      `${label} __root.tsx must import Sidebar from components/ui`
    );
  }
});

test("PB-Sidebar: finance bottom nav is extracted to its own component", () => {
  const bottomNavPath = path.join(financeWebDir, "components/navigation/bottom-nav.tsx");
  assert(fs.existsSync(bottomNavPath), "finance bottom-nav.tsx must exist");
  const bottomNavContent = fs.readFileSync(bottomNavPath, "utf-8");
  assert(bottomNavContent.includes("export function BottomNav"), "bottom-nav.tsx must export BottomNav");
  assert(bottomNavContent.includes("items"), "BottomNav must accept items");
  assert(bottomNavContent.includes("activePath"), "BottomNav must accept activePath");
  const rootContent = fs.readFileSync(path.join(financeWebDir, "routes/__root.tsx"), "utf-8");
  assert(rootContent.includes("<BottomNav"), "finance __root.tsx must render <BottomNav>");
  assert(!rootContent.includes("md:hidden fixed bottom-0"), "finance __root.tsx must not keep inline bottom nav markup");
});

test("PB-Sidebar: nested routes keep their parent menu item active", () => {
  const financeRoot = fs.readFileSync(path.join(financeWebDir, "routes/__root.tsx"), "utf-8");
  assert(
    /to:\s*"\/transactions"[^}]*match:\s*"prefix"/.test(financeRoot),
    'finance /transactions item must use match: "prefix" (only it covers /transactions/create)'
  );

  const habbitRoot = fs.readFileSync(path.join(habbitWebDir, "routes/__root.tsx"), "utf-8");
  assert(
    !/to:\s*"\/grocery-list"[^}]*match:\s*"prefix"/.test(habbitRoot),
    'habbit /grocery-list must stay exact: /manage and /settings have their own items, a prefix match would highlight two at once'
  );
});

test("PB-Sidebar: Tailwind scans packages/ui so @repo/ui-only classes are generated", () => {
  const stylesPath = path.join(repoRoot, "packages/tailwind-config/styles.css");
  const stylesContent = fs.readFileSync(stylesPath, "utf-8");
  assert(
    /@source\s+"\.\.\/ui\/src"/.test(stylesContent),
    "packages/tailwind-config/styles.css must register packages/ui via @source"
  );

  const cssDir = path.join(repoRoot, "apps/habbit-tracker-web/dist/assets");
  if (fs.existsSync(cssDir)) {
    const cssFile = fs
      .readdirSync(cssDir)
      .filter((f) => f.endsWith(".css"))
      .map((f) => path.join(cssDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
    if (cssFile) {
      const css = fs.readFileSync(cssFile, "utf-8");
      assert(/\.md\\:flex\{display:flex\}/.test(css), "built CSS must contain the md:flex utility used by Sidebar");
      assert(/\.w-64\{/.test(css), "built CSS must contain the w-64 utility used by Sidebar");
    }
  }
});

// 6. Sidebar Parity: shared AppSwitcher + finance logout
function financeSidebarBlock() {
  const rootContent = fs.readFileSync(path.join(financeWebDir, "routes/__root.tsx"), "utf-8");
  const start = rootContent.indexOf("<Sidebar");
  const end = rootContent.indexOf("\n      />", start);
  assert(start !== -1 && end !== -1, "finance __root.tsx must contain a self-closing <Sidebar ... /> block");
  return rootContent.slice(start, end);
}

test("PB-SidebarParity: shared AppSwitcher lives in @repo/ui and is exported", () => {
  const switcherPath = path.join(repoUiDir, "components/app-switcher.tsx");
  assert(fs.existsSync(switcherPath), "packages/ui/src/components/app-switcher.tsx must exist");
  const content = fs.readFileSync(switcherPath, "utf-8");
  assert(content.includes("export function AppSwitcher"), "app-switcher.tsx must export AppSwitcher");
  assert(content.includes("export interface AppSwitcherApp"), "app-switcher.tsx must export AppSwitcherApp");
  const indexContent = fs.readFileSync(path.join(repoUiDir, "index.ts"), "utf-8");
  assert(indexContent.includes('"./components/app-switcher"'), "@repo/ui index must re-export app-switcher");
});

test("PB-SidebarParity: AppSwitcher stays router-agnostic (no TanStack Router import)", () => {
  const content = fs.readFileSync(path.join(repoUiDir, "components/app-switcher.tsx"), "utf-8");
  assert(!content.includes("@tanstack/react-router"), "app-switcher.tsx must not import @tanstack/react-router");
  assert(content.includes("onSelect"), "app-switcher.tsx must delegate navigation through onSelect");
  assert(content.includes("activeAppId"), "app-switcher.tsx must accept activeAppId");
});

test("PB-SidebarParity: both apps re-export AppSwitcher from components/ui", () => {
  for (const [label, dir] of [["habbit", habbitWebDir], ["finance", financeWebDir]]) {
    const wrapperPath = path.join(dir, "components/ui/app-switcher.tsx");
    assert(fs.existsSync(wrapperPath), `${label} app must have components/ui/app-switcher.tsx`);
    const wrapperContent = fs.readFileSync(wrapperPath, "utf-8");
    assert(wrapperContent.includes("AppSwitcher"), `${label} wrapper must export AppSwitcher`);
    assert(wrapperContent.includes("@repo/ui"), `${label} wrapper must re-export from @repo/ui`);
  }
});

test("PB-SidebarParity: habit AppSwitcher is a thin wrapper over the shared component", () => {
  const content = fs.readFileSync(path.join(habbitWebDir, "components/app-switcher.tsx"), "utf-8");
  assert(content.includes('from "../components/ui/app-switcher"'), "habit must import the shared AppSwitcher");
  assert(content.includes("APPS_REGISTRY"), "habit wrapper must keep using APPS_REGISTRY");
  assert(!content.includes("ChevronsUpDown"), "habit must no longer own the switcher markup");
});

test("PB-SidebarParity: finance AppSwitcher navigates sibling apps by URL", () => {
  const content = fs.readFileSync(path.join(financeWebDir, "components/app-switcher.tsx"), "utf-8");
  assert(content.includes('from "../components/ui/app-switcher"'), "finance must import the shared AppSwitcher");
  assert(content.includes("CURRENT_APP_ID"), "finance must pin its own active app id");
  assert(content.includes("window.location.href"), "finance must navigate sibling apps by URL");

  const configPath = path.join(financeWebDir, "config/apps.config.ts");
  assert(fs.existsSync(configPath), "finance must define config/apps.config.ts");
  const config = fs.readFileSync(configPath, "utf-8");
  assert(config.includes('CURRENT_APP_ID = "couple-finances"'), "finance active app must be couple-finances");
  for (const id of ["habit-pasutri", "grocery-list", "couple-finances", "couple-calendar"]) {
    assert(config.includes(`id: "${id}"`), `finance switcher list must include ${id}`);
  }
});

test("PB-SidebarParity: finance sidebar header uses AppSwitcher + profile card", () => {
  const block = financeSidebarBlock();
  assert(block.includes("<AppSwitcher"), "finance sidebar must render <AppSwitcher>");
  assert(block.includes("header={"), "finance sidebar must keep a header slot");
  assert(block.includes("user.avatar_emoji"), "finance sidebar header must render the user profile");
});

test("PB-SidebarParity: finance sidebar drops brand header, habit link, and theme toggle", () => {
  const block = financeSidebarBlock();
  assert(!block.includes("Keuangan Pasutri"), "finance sidebar must no longer render its own brand header");
  assert(!block.includes("HABIT_APP_URL"), "finance sidebar must no longer link to the habit app");
  assert(!block.includes("Buka Habit Tracker"), "finance sidebar must no longer show a manual app link");
  assert(!block.includes("QuickThemeToggle"), "finance sidebar must no longer embed the theme toggle");
});

test("PB-SidebarParity: finance sidebar footer keeps the primary action and adds logout", () => {
  const block = financeSidebarBlock();
  assert(block.includes("footer={"), "finance sidebar must keep a footer slot");
  assert(block.includes("+ Transaksi"), "finance sidebar footer must keep the primary action");
  assert(block.includes("handleLogout"), "finance sidebar footer must wire a logout handler");
  assert(block.includes("LogOut"), "finance sidebar footer must render the LogOut icon");
});

test("PB-SidebarParity: finance API exposes POST /api/auth/logout", () => {
  const routes = fs.readFileSync(
    path.join(repoRoot, "apps/finance-tracker-api/src/modules/auth/auth.routes.ts"),
    "utf-8"
  );
  assert(/router\.post\(\s*"\/logout"/.test(routes), "finance auth routes must register POST /logout");

  const controller = fs.readFileSync(
    path.join(repoRoot, "apps/finance-tracker-api/src/modules/auth/auth.controller.ts"),
    "utf-8"
  );
  assert(controller.includes("export async function logout"), "finance controller must export logout");
  assert(controller.includes('clearCookie("token"'), "finance logout must clear the shared token cookie");
});

test("PB-SidebarParity: finance web can log out and hand back to the habit app", () => {
  const service = fs.readFileSync(path.join(financeWebDir, "services/auth.service.ts"), "utf-8");
  assert(service.includes("export async function logout"), "auth.service must export logout");
  assert(service.includes('api.post("/auth/logout")'), "auth.service must call the finance logout endpoint");
  assert(service.includes("export function redirectAfterLogout"), "auth.service must export redirectAfterLogout");
  assert(service.includes("/login"), "redirectAfterLogout must target the habit login screen");
});

test("PB-SidebarParity: habit app registry no longer carries a corrupted emoji", () => {
  const config = fs.readFileSync(path.join(habbitWebDir, "config/apps.config.ts"), "utf-8");
  assert(!config.includes("\uFFFD"), "apps.config.ts must not contain the U+FFFD replacement character");
  assert(config.includes('emoji: "💰"'), "couple-finances must use the money-bag emoji");
});

console.log("------------------------------------------------------------------");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("------------------------------------------------------------------");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All UI component harmonization checks PASSED successfully!");
}
