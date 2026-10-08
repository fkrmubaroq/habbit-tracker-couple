#!/usr/bin/env node
// new-test-matrix.mjs — scaffold docs/qa/<slug>/test-matrix.md with the
// EXACT structure SKILL.md Step 4 requires (header block, both Summary
// tables, one PB section with a correctly-columned 19-column test case
// table), instead of leaving the agent to reproduce that structure from
// memory every time.
//
// Confirmed necessary (2026-09-22): a live audit of 38 test-matrix.md files
// across knitto-api-chat/knitto-web-omnichannel/knitto-widget-chat found
// only 5 actually matching this skill's column order — the other 33 were
// written ad hoc (4 simple columns, no Summary, no traceability index) by
// sessions that reconstructed the format from memory instead of starting
// from assets/test-matrix-template.md. This script removes that failure
// mode: the skeleton it writes cannot drift from the spec because it comes
// from the spec.
//
// This does NOT generate test case content — reading the PRD/code and
// writing real Indonesian scenarios is still the agent's job (Steps 1-3 of
// SKILL.md). This only guarantees the shape is right before any content
// goes in.
//
// Usage:
//   node scripts/new-test-matrix.mjs <slug> --feature "Nama Fitur" \
//     [--source "docs/prd/todo/<slug>/PRD.md, .../ISSUES.md"] \
//     [--scope "..."] [--out-of-scope "..."] \
//     [--pb "<PB heading, e.g. PB-1 — Login flow>"]... \
//     [--out <path>] [--force]
//
// Repeat --pb once per PB/requirement group (Step 3 of SKILL.md) — each one
// becomes its own "### PB-<n>" section with its own traceability table and
// test case table. Defaults to a single "PB-1 — <feature>" section if none
// given, since most features start as one group.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug) {
  console.error("Usage: node scripts/new-test-matrix.mjs <slug> --feature \"Nama Fitur\" [--pb \"...\"]...");
  process.exit(1);
}

function argValues(flag) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag) out.push(args[i + 1]);
  }
  return out;
}
function argValue(flag, fallback) {
  const vals = argValues(flag);
  return vals.length > 0 ? vals[vals.length - 1] : fallback;
}

const feature = argValue("--feature", slug);
const source = argValue("--source", "<link PRD/ISSUES/BRD/issue, atau \"informal — dari deskripsi user\">");
const scope = argValue("--scope", "<apa yang dicakup>");
const outOfScope = argValue("--out-of-scope", "<apa yang eksplisit tidak dicakup>");
const outPath = argValue("--out", path.join("docs", "qa", slug, "test-matrix.md"));
const force = args.includes("--force");

let pbTitles = argValues("--pb");
if (pbTitles.length === 0) pbTitles = [`PB-1 — ${feature}`];

const today = new Date().toISOString().slice(0, 10);

const TEST_CASE_HEADER =
  "| Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test Variable | Scenario | Test Case | Pre-Condition | Test Data | Test Steps | Expected Result | Status | Evidence | Remarks | Automation Tools | Date | Files | Requirement |";
const TEST_CASE_SEP =
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|";

function pbSection(title, n) {
  return `### ${title}

Mini traceability khusus PB ini — ganti "Traceability Matrix" global:

| NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID |
|---|---|---|---|
| 1 | <spec/acceptance criterion, ID> | [ ] | ⚠️ Gap |

${TEST_CASE_HEADER}
${TEST_CASE_SEP}
| 1 | <nama sub-fitur/flow, ID> | <FC x.x - Proses x, atau kosong> | + | TC${n}-1 | <ringkas variasi input, ID, atau kosong> | <skenario yang diuji grup ini, ID> | <judul deskriptif, ID> | <state awal, ID> | <input spesifik, ID> | 1. <aksi, ID> | 1. <hasil, ID> | Progress | | | Tanpa Automation | | \`<path/file/relevan.ts>\` | <link requirement> |
`;
}

const body = `# Test Matrix — ${feature}

| PROGRAM VERSION RELEASE | - | TESTER | - | TEST CASE CREATED AT | ${today} |
|---|---|---|---|---|---|
| FOLDER TEST APP | - | PROGRAMMER | - | TEST CASE UPDATED AT | ${today} |
| IP DEV | - | TASK DEV | - | | |
| IP PROD | - | | | | |

**Sumber requirement:** ${source}
**Scope:** ${scope}
**Out of scope:** ${outOfScope}

## Summary

Hitung ulang dari kolom \`Status\`/\`Automation Tools\` di tabel Test Cases
setiap file ini diupdate — jangan dipelihara terpisah.

| Total Test Case | Passed | Failed | Re-Test | Skip |
|---|---|---|---|---|
| ${pbTitles.length} | 0 | 0 | 0 | 0 |

| Total Penggunaan Automation Test | Test Data | Masuk Test Step | Tanpa Automation | Presentase | Memenuhi Syarat |
|---|---|---|---|---|---|
| 0 | 0 | 0 | ${pbTitles.length} | 0% | Belum Memenuhi Syarat |

\`Memenuhi Syarat\` bila \`Presentase\` > 24% (rumus sheet V4).

## Test Cases

Satu section \`### PB-<n>\` per PB/requirement group. Nama kolom tabel
mengikuti istilah tester manual persis (bahasa Inggris, urutan sama, jangan
diterjemahkan/diubah) — isinya ditulis dalam **Bahasa Indonesia**.

${pbTitles.map((t, i) => pbSection(t, i + 1)).join("\n")}`;

if (existsSync(outPath) && !force) {
  console.error(`${outPath} already exists — pass --force to overwrite, or edit it directly. Refusing to clobber existing test cases.`);
  process.exit(1);
}

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, body);
console.log(`Wrote scaffold to ${outPath}`);
console.log(`Next: fill in the ${pbTitles.length} PB section(s) per SKILL.md Steps 1-3 (find requirements, build a parameter matrix if relevant, extract scenarios across Functional/Edge/Error/State categories), replacing every <placeholder>.`);
console.log(`Then run: node scripts/lint-test-matrix.mjs "${outPath}" to check the structure holds once filled in.`);
