#!/usr/bin/env node
// lint-test-matrix.mjs — validate an existing docs/qa/<slug>/test-matrix.md
// against the exact structure SKILL.md Step 4 defines. Read-only: reports
// drift, never rewrites a file.
//
// Confirmed necessary (2026-09-22): found 33/38 real test-matrix.md files
// across three repos silently using a simplified ad-hoc format (4 columns,
// no Summary, IDs like "CFG-1" instead of "TC1-1") instead of this skill's
// tester-spreadsheet layout — written by sessions that never actually
// invoked test-case-matrix. This is the same class of drift `audit.mjs`
// (github-project-pipeline skill) catches for Project/plan-file state,
// applied to test-matrix files instead.
//
// Usage:
//   node scripts/lint-test-matrix.mjs <path-or-glob>...   # explicit files
//   node scripts/lint-test-matrix.mjs                      # scan docs/qa/**/test-matrix.md under cwd
//   node scripts/lint-test-matrix.mjs --json
//
// Exit code: non-zero if any file has an ERROR-level finding. WARNING-level
// findings never fail the run — they're worth looking at, not blocking.

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const explicitPaths = args.filter((a) => !a.startsWith("--"));

// Spreadsheet "FORMAT TEST CASE V4" column order (+ this skill's Files/Requirement).
const EXPECTED_COLUMNS = [
  "Group No", "Feature", "Process No (FC)", "TYPE", "Test Case ID",
  "Test Variable", "Scenario", "Test Case", "Pre-Condition", "Test Data", "Test Steps",
  "Expected Result", "Status", "Evidence", "Remarks", "Automation Tools",
  "Date", "Files", "Requirement",
];
// Pre-V4 layout (skill v1): no Scenario column. Still parsed, flagged as WARNING so
// existing files migrate when touched instead of failing every lint run at once.
const LEGACY_COLUMNS = EXPECTED_COLUMNS.filter((c) => c !== "Scenario");
const STATUS_VALUES = new Set(["Progress", "Passed", "Failed", "Re-Test", "Skip"]);
const LEGACY_STATUS_VALUES = new Set(["⚪ Not Run", "🟡 Progress", "✅ Passed", "❌ Failed", "🔁 Re-Test", "⏭ Skip"]);
const CHECKBOX_VALUES = new Set(["[x]", "[X]", "[ ]"]);
const MEMENUHI_THRESHOLD = 0.24;
const AUTOMATION_VALUES = new Set(["Masuk Test Step", "Test Data", "Tanpa Automation"]);
const TEST_CASE_ID_RE = /^TC\d+-\d+$/;

// ---------------------------------------------------------------------------
// Discovery

function findTestMatrixFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findTestMatrixFiles(full));
    else if (e.isFile() && e.name === "test-matrix.md") out.push(full);
  }
  return out;
}

function resolveFiles() {
  if (explicitPaths.length === 0) return findTestMatrixFiles(process.cwd());
  const out = [];
  for (const p of explicitPaths) {
    const st = statSync(p, { throwIfNoEntry: false });
    if (st && st.isDirectory()) out.push(...findTestMatrixFiles(p));
    else out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Minimal markdown table parser — enough for this file's own conventions,
// not a general GFM parser.

function isTableRow(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}
function isSeparatorRow(line) {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line) && line.includes("-");
}
function splitRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function parseTables(content) {
  const lines = content.split(/\r?\n/);
  const tables = [];
  let i = 0;
  while (i < lines.length) {
    if (isTableRow(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const header = splitRow(lines[i]);
      const headerLine = i + 1;
      let j = i + 2;
      const rows = [];
      while (j < lines.length && isTableRow(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      tables.push({ header, rows, line: headerLine });
      i = j;
    } else {
      i++;
    }
  }
  return tables;
}

// ---------------------------------------------------------------------------
// Checks

function lintFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const tables = parseTables(content);
  const findings = [];

  const summary1 = tables.find((t) => t.header[0] === "Total Test Case");
  const summary2 = tables.find((t) => t.header[0] === "Total Penggunaan Automation Test");
  const sameHeader = (t, cols) => t.header.length === cols.length && cols.every((c, i) => t.header[i] === c);
  const legacyTables = tables.filter((t) => t.header[0] === "Group No" && sameHeader(t, LEGACY_COLUMNS));
  const testCaseTables = tables.filter(
    (t) => t.header.length === EXPECTED_COLUMNS.length && t.header[0] === "Group No"
  );
  const wrongShapedTables = tables.filter(
    (t) => t.header[0] === "Group No" && t.header.length !== EXPECTED_COLUMNS.length && !legacyTables.includes(t)
  );
  const traceabilityTables = tables.filter(
    (t) => t.header.length === 4 && t.header[0] === "NO" && t.header[1] === "PROGRAM SPECIFICATIONS"
  );

  if (!summary1) findings.push({ level: "ERROR", type: "MISSING_SUMMARY_1", detail: "No 'Total Test Case | Passed | Failed | Re-Test | Skip' Summary table found." });
  if (!summary2) findings.push({ level: "ERROR", type: "MISSING_SUMMARY_2", detail: "No 'Total Penggunaan Automation Test | ...' Summary table found." });

  for (const t of legacyTables) {
    findings.push({
      level: "WARNING",
      type: "LEGACY_FORMAT",
      detail: `Table at line ${t.line} uses the pre-V4 ${LEGACY_COLUMNS.length}-column layout (no "Scenario" column). Migrate: insert "Scenario" after "Test Variable".`,
    });
  }

  if (testCaseTables.length === 0 && wrongShapedTables.length === 0 && legacyTables.length === 0) {
    findings.push({ level: "ERROR", type: "NO_TEST_CASE_TABLE", detail: "No table starting with a 'Group No' column found at all — this file doesn't look like it followed the test-case-matrix template." });
  }

  for (const t of wrongShapedTables) {
    findings.push({
      level: "ERROR",
      type: "WRONG_COLUMNS",
      detail: `Table at line ${t.line} has ${t.header.length} column(s) (${t.header.join(", ")}) instead of the expected ${EXPECTED_COLUMNS.length}: ${EXPECTED_COLUMNS.join(", ")}. This is the "simplified ad-hoc format" drift — looks like it wasn't generated from assets/test-matrix-template.md.`,
    });
  }

  for (const t of testCaseTables) {
    for (let ci = 0; ci < EXPECTED_COLUMNS.length; ci++) {
      if (t.header[ci] !== EXPECTED_COLUMNS[ci]) {
        findings.push({
          level: "ERROR",
          type: "COLUMN_ORDER",
          detail: `Table at line ${t.line}: column ${ci + 1} is "${t.header[ci]}", expected "${EXPECTED_COLUMNS[ci]}" in this exact position.`,
        });
      }
    }
  }

  const allCaseTables = [...testCaseTables, ...legacyTables];
  for (const t of allCaseTables) {
    const col = (name) => t.header.indexOf(name);
    const idIdx = col("Test Case ID"), statusIdx = col("Status"), autoIdx = col("Automation Tools");
    for (const row of t.rows) {
      const id = row[idIdx];
      const status = row[statusIdx];
      const automation = row[autoIdx];
      if (id && id !== `TC${row[0]}-?` && !TEST_CASE_ID_RE.test(id)) {
        findings.push({ level: "WARNING", type: "BAD_TEST_CASE_ID", detail: `Row "${id}" doesn't match TC<n>-<m> pattern (e.g. TC1-1).` });
      }
      if (status && LEGACY_STATUS_VALUES.has(status)) {
        findings.push({ level: "WARNING", type: "LEGACY_STATUS", detail: `Row ${id || "?"}: Status "${status}" is the pre-V4 emoji form — use the V4 value (${[...STATUS_VALUES].join(", ")}; not run yet = Progress).` });
      } else if (status && !STATUS_VALUES.has(status)) {
        findings.push({ level: "WARNING", type: "BAD_STATUS", detail: `Row ${id || "?"}: Status "${status}" isn't one of ${[...STATUS_VALUES].join(", ")}.` });
      }
      if (automation && !AUTOMATION_VALUES.has(automation)) {
        findings.push({ level: "WARNING", type: "BAD_AUTOMATION_TOOLS", detail: `Row ${id || "?"}: Automation Tools "${automation}" isn't one of ${[...AUTOMATION_VALUES].join(", ")}.` });
      }
    }
  }

  if (traceabilityTables.length === 0 && allCaseTables.length > 0) {
    findings.push({ level: "WARNING", type: "NO_TRACEABILITY_INDEX", detail: "No per-PB 'NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID' mini traceability table found." });
  }
  for (const t of traceabilityTables) {
    for (const row of t.rows) {
      if (row[2] && !CHECKBOX_VALUES.has(row[2])) {
        findings.push({ level: "WARNING", type: "TRACEABILITY_NOT_CHECKBOX", detail: `Traceability row ${row[0] || "?"} (line ${t.line}): TEST CASE "${row[2]}" should be a checkbox — [x] covered, [ ] gap.` });
      }
    }
  }

  if (summary1) {
    const totalCol = summary1.rows[0]?.[0];
    const actualTotal = allCaseTables.reduce((n, t) => n + t.rows.length, 0);
    if (totalCol && Number(totalCol) !== actualTotal && allCaseTables.length > 0) {
      findings.push({ level: "WARNING", type: "SUMMARY_COUNT_MISMATCH", detail: `Summary says Total Test Case = ${totalCol}, but ${actualTotal} row(s) actually exist across the test case table(s) — recount and rewrite the Summary.` });
    }
  }

  if (summary2) {
    const [, , , , pct, verdict] = summary2.rows[0] ?? [];
    const ratio = Number.parseFloat(String(pct ?? "").replace("%", "").replace(",", ".")) / 100;
    if (verdict && !Number.isNaN(ratio)) {
      const expected = ratio > MEMENUHI_THRESHOLD ? "Memenuhi Syarat" : "Belum Memenuhi Syarat";
      if (verdict !== expected) {
        findings.push({ level: "WARNING", type: "MEMENUHI_SYARAT", detail: `Presentase ${pct} → "Memenuhi Syarat" should be "${expected}" (V4 threshold: > 24%), found "${verdict}".` });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Main

function main() {
  const files = resolveFiles();
  if (files.length === 0) {
    console.error("No test-matrix.md files found (pass explicit paths, or run from a directory containing docs/qa/**/test-matrix.md).");
    process.exitCode = 1;
    return;
  }

  const results = files.map((f) => ({ file: f, findings: lintFile(f) }));
  const hasError = results.some((r) => r.findings.some((f) => f.level === "ERROR"));

  if (JSON_OUT) {
    console.log(JSON.stringify({ results }, null, 2));
  } else {
    let clean = 0;
    for (const r of results) {
      if (r.findings.length === 0) {
        clean++;
        continue;
      }
      console.log(`\n${r.file}`);
      for (const f of r.findings) console.log(`  [${f.level}] ${f.type}: ${f.detail}`);
    }
    console.log(`\n${files.length} file(s) checked, ${clean} clean, ${files.length - clean} with findings.`);
  }

  process.exitCode = hasError ? 1 : 0;
}

main();
