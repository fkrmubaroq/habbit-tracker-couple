#!/usr/bin/env node
// move-plan.mjs — atomically move a Convention-A plan between
// docs/prd/todo/<slug>/ and docs/prd/done/<slug>/, and fix every relative
// link that pointed at the old location — instead of leaving the actual
// move to whichever agent/tool is running "/gate" that day.
//
// Confirmed necessary (2026-09-22): different tools finish this move
// differently — some `git mv` the whole directory (fine), others write the
// two files at the new path and delete the old ones individually, which can
// leave an empty `todo/<slug>/` directory behind when the delete step is
// incomplete. A single atomic rename can't do that halfway.
//
// Usage:
//   node scripts/move-plan.mjs --slug <slug> --to done|todo [--cwd <repo-path>] [--force]
//
// `--to done` moves todo/<slug> -> done/<slug> (gate.md Step 6's job).
// `--to todo` moves done/<slug> -> todo/<slug> (prd-grill's own job when
// reopening a "done" plan for new work, per references/output-conventions.md).

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, rmdirSync, renameSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
function argValue(flag, required = true, fallback = null) {
  const i = args.indexOf(flag);
  if (i < 0) { if (required) throw new Error(`Missing required flag ${flag}`); return fallback; }
  return args[i + 1];
}

const slug = argValue("--slug");
const to = argValue("--to");
if (!["done", "todo"].includes(to)) throw new Error(`--to must be "done" or "todo", got "${to}"`);
const from = to === "done" ? "todo" : "done";
const cwd = argValue("--cwd", false, process.cwd());
const force = args.includes("--force");

const root = path.join(cwd, "docs", "prd");
const srcDir = path.join(root, from, slug);
const destDir = path.join(root, to, slug);

if (!existsSync(srcDir)) {
  throw new Error(`${srcDir} doesn't exist — nothing to move. (Looking for a Convention-A plan; see references/output-conventions.md if this repo uses Convention B instead.)`);
}
if (existsSync(destDir) && !force) {
  throw new Error(`${destDir} already exists — refusing to clobber it. Pass --force only if you're sure it's safe to overwrite.`);
}

function isGitRepo(dir) {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: dir, stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Step 1 — the move itself, one atomic operation, never file-by-file.

const relSrc = path.relative(cwd, srcDir);
const relDest = path.relative(cwd, destDir);
// git (via MSYS on Windows) expects forward slashes in argv paths — a
// native path.relative() backslash path can make `git mv` fail with a
// spurious "no such file or directory" even though the directory exists.
const gitSrc = relSrc.split(path.sep).join("/");
const gitDest = relDest.split(path.sep).join("/");

// `git mv`/`fs.renameSync` both require the destination's PARENT to already
// exist — docs/prd/done/ (or todo/) may not exist yet the very first time a
// program's plans move in a given direction. Confirmed to fail with a
// misleading "no such file or directory" (naming the SOURCE, not the real
// cause) if skipped.
mkdirSync(path.dirname(destDir), { recursive: true });

if (isGitRepo(cwd)) {
  execFileSync("git", ["mv", gitSrc, gitDest], { cwd });
  console.log(`git mv "${relSrc}" -> "${relDest}"`);
} else {
  renameSync(srcDir, destDir);
  console.log(`Renamed "${relSrc}" -> "${relDest}" (not a git repo — plain fs rename).`);
}

// Verify the move was actually complete — a real rename can't leave a
// half-moved directory, but check anyway so this script fails loudly
// instead of silently if something unexpected happened (e.g. a symlink).
if (existsSync(srcDir)) {
  try {
    rmdirSync(srcDir);
    console.log(`Removed leftover empty directory at "${relSrc}" (this is exactly the bug this script exists to prevent — if you see this line, something upstream still isn't using an atomic move).`);
  } catch (err) {
    throw new Error(`"${relSrc}" still exists after the move and isn't empty — investigate manually. (${err.message})`);
  }
}

// ---------------------------------------------------------------------------
// Step 2 — fix relative links, both inside the moved files and anywhere
// else in the repo that pointed at the old path (gate.md Step 6: "fix any
// relative links in it or pointing to it").

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const oldPathFragment = `docs/prd/${from}/${slug}`;
const newPathFragment = `docs/prd/${to}/${slug}`;
const touched = [];

for (const file of walk(cwd)) {
  const content = readFileSync(file, "utf8");
  if (!content.includes(oldPathFragment)) continue;
  const updated = content.split(oldPathFragment).join(newPathFragment);
  writeFileSync(file, updated);
  touched.push(path.relative(cwd, file));
}

if (touched.length > 0) {
  console.log(`Rewrote "${oldPathFragment}" -> "${newPathFragment}" in ${touched.length} file(s):`);
  for (const f of touched) console.log(`  ${f}`);
} else {
  console.log(`No other file referenced "${oldPathFragment}" — nothing else to fix.`);
}

console.log(`\nDone: ${slug} moved ${from}/ -> ${to}/.`);
