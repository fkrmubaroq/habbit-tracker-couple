---
name: test-case-matrix
description: Use when a feature/spec needs test scenarios written down BEFORE implementation or before automating tests — triggers on "/test-case-matrix", "buatkan test matrix", "buatkan test case", "test scenario apa aja", or as the mandatory first step when a qa-engineer-style agent is invoked. Reads the PRD/issue/spec for a feature (or asks for a quick feature description if none exists), optionally builds a parameter/value combination matrix first for features with multiple interacting variables, groups scenarios into PB (Product Backlog/requirement) sections, and writes a single markdown file mirroring the manual-tester spreadsheet layout: header metadata, two-part Summary (pass/fail counts + automation-usage percentage), one section per PB with a mini traceability index (spec → covered? → test case id) followed by a test case table in the tester's exact column order of spreadsheet "FORMAT TEST CASE V4" (Group No, Feature, Process No (FC), TYPE, Test Case ID like `TC1-1`, Test Variable, Scenario, Test Case, Pre-Condition, Test Data, Test Steps, Expected Result, Status [Progress/Passed/Failed/Re-Test/Skip], Evidence, Remarks, Automation Tools [Masuk Test Step/Test Data/Tanpa Automation], Date) plus Files/Requirement appended; V4 header metadata, checkbox traceability, and the V4 "Memenuhi Syarat" threshold (> 24%). Cell content in Bahasa Indonesia with concrete UI-accurate steps, column names left in English. Does not write or run any test code — that's `react-testing`/`e2e-testing`/`webapp-testing`'s job, this skill only produces the scenario list those skills implement against.
license: MIT
metadata:
  category: testing
  author: lintang
  version: "2.0.0"
allowed-tools: [Read, Write, Glob, Grep, Bash]
argument-hint: "[feature/slug or PRD path]"
compatible_with: [claude-code, opencode, antigravity]
---

# /test-case-matrix

Turn a feature's requirements into a complete, checkable list of test
scenarios in markdown — before any test code is written. This is a planning
artifact, not test automation: it produces the scenario list that
`react-testing`, `e2e-testing`, or `webapp-testing` then implement against.

## When this runs

- Called directly (`/test-case-matrix <feature>` or "buatkan test matrix
  untuk X").
- Called as the mandatory first step by a `qa-engineer`-style agent, before
  it touches any test code — the matrix is the plan, implementation follows
  it, not the other way around.

## Bahasa & detail step

Nama kolom tabel tetap persis seperti di Step 4 (bahasa Inggris, match
istilah tester manual: `Test Case ID`, `Pre-Condition`, `Test Data`, `Test
Steps`, `Expected Result`, dst) — jangan diterjemahkan, supaya konsisten
lintas file dan gampang di-grep. **Isi selnya** yang ditulis dalam
**Bahasa Indonesia**: `Scenario`, `Test Case`, `Feature`, `Pre-Condition`,
`Test Data`, `Test Steps`, `Expected Result`, `Requirement` (ringkasan), dan
`Remarks`. `Test Case ID`/status value (`TC1-1`, `Passed`, `Masuk Test Step`,
dst) tetap apa adanya — persis nilai dropdown spreadsheet V4 supaya bisa
di-copy ke sheet tester tanpa diubah.
Kalau requirement source-nya berbahasa Inggris, terjemahkan isinya saat
ditulis ke matrix, jangan copy-paste mentah.

Tiap langkah di `Test Steps`/`Expected Result` harus **konkret dan sesuai
alur nyata aplikasi** — bukan deskripsi generik ("test the form",
"verifikasi berhasil"). Sebelum menulis steps, cek UI/kode yang relevan
(nama tombol/field/route sebenarnya lewat Glob/Grep singkat di Step 3)
supaya langkahnya bisa langsung diikuti tester manual tanpa buka kode:
"1. Buka `/login`" + Expected "Form login tampil" jauh lebih berguna
daripada "1. Buka halaman login" + Expected "Berhasil". Kalau ada
`data-testid` atau selector yang jelas, sebutkan literalnya di step.

## Step 1 — Find the requirement source

Look for a spec covering this feature, in priority order:
1. A PRD/ISSUES pair from `prd-grill` (`docs/prd/**/PRD.md`,
   `docs/prd/**/ISSUES.md`) or a BRD read via `brd-reader`, if the
   slug/feature name matches.
2. A GitHub issue (`gh issue view <n>`) if the user references one.
3. Any other plan/spec doc in the repo that plausibly covers this feature.

If nothing structured exists, ask the user for a short feature description
(what it does, main user flows, explicit constraints) — don't invent
requirements. Note in the output header that requirements are informal.

## Step 2 — Build the parameter matrix (when relevant)

Skip this step for simple features (single input, no interacting options) —
go straight to Step 3. Do it when the feature has multiple variables that
combine (order type × payment method × item type, form field × validation
mode, role × permission level, etc.):

1. List each variable that affects behavior and its possible values.
2. Build a combination table: which value-sets actually need a test case.
   Don't do a full cartesian product once there are more than ~3 variables —
   pick the combinations that are realistic and that differ in behavior
   (pairwise coverage), plus any combination explicitly called out in the
   requirement source as high-risk.
3. Each row in this table becomes (or feeds) a scenario in Step 4 —
   reference the combination id in that case's `Test Variable` column
   (e.g. "K1") so the link back is visible.

This mirrors combinatorial test design: the matrix exists to make sure
scenario coverage isn't just "one happy path + one error", but the actual
value combinations that behave differently.

## Step 3 — Extract scenarios

From the requirement source, list every scenario across these categories —
don't stop at the happy path. These categories are an **elicitation
checklist only** — they don't appear in the final `Test Case ID` anymore
(see Step 4), they just make sure coverage isn't just "one happy path +
one error":

- **Functional** — each documented behavior/flow, including every stated
  acceptance criterion.
- **Edge case** — boundary values, empty/null input, max-size input,
  unusual-but-valid combinations.
- **Error handling** — invalid input, failed dependencies (network/API
  down), permission denied, concurrent-conflict cases.
- **State transition** — any state machine or multi-step flow in the
  feature (e.g. draft → published, pending → approved/rejected).

Skip a category only if it's genuinely inapplicable (e.g. a stateless
read-only endpoint has no state transition) — don't skip because it's more
work.

Also group scenarios into **PB items** (Product Backlog / requirement
groups — one PB per distinct feature request, BRD, or PRD covered). If the
requirement source already has this grouping (BRD/PB numbers), use it
directly. If it doesn't (informal source), create one PB group per
distinct sub-feature — this becomes the `### PB-<n>` heading in Step 4.
Within a PB, group further into **Group No** — one group per user
flow/scenario cluster that shares the same precondition setup (mirrors how
`TC1-1`, `TC1-2` in Step 4 share the id prefix `1`).

For each scenario, also identify the source file(s) it exercises (the
component/page/hook/handler/endpoint under test) — a quick Glob/Grep pass
over the repo for the feature's name/route/component is usually enough,
don't do a full deep-dive. This is what goes in the `Files` column in Step
4; it's what lets someone find every test case affected when a specific
file changes, not just when a requirement changes.

## Step 4 — Write the matrix

Write one file: `docs/qa/<slug>/test-matrix.md` (create the folder if
missing). **Scaffold it with `scripts/new-test-matrix.mjs` first, don't
hand-copy `assets/test-matrix-template.md` from memory:**

```bash
node scripts/new-test-matrix.mjs <slug> --feature "<Nama Fitur>" \
  --source "docs/prd/todo/<slug>/PRD.md, .../ISSUES.md" \
  --pb "PB-1 — <requirement group 1>" --pb "PB-2 — <requirement group 2>"
```

(repeat `--pb` once per PB group from Step 3; omit it entirely for a
single-PB feature). This writes the file with the header block, both
Summary tables, and one correctly-19-columned test case table per `--pb`
already in place — confirmed necessary 2026-09-22: an audit of 38 real
`test-matrix.md` files across a live program found 33 had silently drifted
into a simplified 4-column ad-hoc format because the structure was
reconstructed from memory each time instead of started from the template.
Scaffolding removes that failure mode — the shape can't drift if it's
generated, not recalled. Then fill in every `<placeholder>` per Steps 1-3.
This mirrors the manual-tester spreadsheet layout (header block, two-part
Summary, PB-grouped test case tables with a per-PB mini traceability index)
— don't restructure it into a single flat table or a category-grouped
layout, the whole point is that this reads the same as the tester's own
sheet.

- **Header** — the V4 metadata block, same labels as the sheet's top-left
  cells: `PROGRAM VERSION RELEASE`, `FOLDER TEST APP`, `IP DEV`, `IP PROD`,
  `TESTER`, `PROGRAMMER`, `TASK DEV`, `TEST CASE CREATED AT`, `TEST CASE
  UPDATED AT` — plus this skill's own `Sumber requirement` (link), `Scope`,
  and `Out of scope`. Unknown values are written `-` (what the sheet itself
  uses for an empty cell) — ask rather than guess for tester/programmer.
- **Summary** — two small tables, both recounted live from the `Status`/
  `Automation Tools` columns below every time the file is updated (never
  maintained separately, that's how these drift):
  - Table 1: `Total Test Case`, `Passed`, `Failed`, `Re-Test`, `Skip`.
  - Table 2: `Total Penggunaan Automation Test` (count of rows whose
    `Automation Tools` is `Test Data` or `Masuk Test Step` — anything but
    `Tanpa Automation`), `Test Data` (count), `Masuk Test Step` (count),
    `Tanpa Automation` (count), `Presentase` (Total Penggunaan Automation
    Test ÷ Total Test Case), `Memenuhi Syarat` — `Memenuhi Syarat` when
    `Presentase` **> 24%**, otherwise `Belum Memenuhi Syarat` (exactly the
    V4 sheet formula `=IF(K9>24%,"Memenuhi Syarat","Belum Memenuhi Syarat")`;
    don't ask for or assume a different threshold).
- **Parameter Matrix** — only if Step 2 produced one; the variable/value
  table plus the combinations selected for testing.
- **Test Cases** — one `### PB-<n> — <requirement id> · <link task> ·
  <link design>` section per PB group from Step 3. Under each PB heading,
  in this order:
  1. A mini traceability table scoped to this PB:
     `NO | PROGRAM SPECIFICATIONS | TEST CASE | TEST CASE ID` — `NO` is
     sequential within the PB, `PROGRAM SPECIFICATIONS` is the spec/
     acceptance criterion in Bahasa Indonesia, `TEST CASE` is a checkbox
     like the V4 sheet's: `[x]` when at least one case covers this spec,
     `[ ]` when nothing does (then `TEST CASE ID` is `⚠️ Gap`), and `TEST
     CASE ID` lists the covering id(s). This **replaces** a separate global
     traceability section — don't add another one at the end of the file.
  2. The test case table itself, **one row per test case**, columns in
     this exact order:
     `Group No | Feature | Process No (FC) | TYPE | Test Case ID | Test
     Variable | Scenario | Test Case | Pre-Condition | Test Data | Test
     Steps | Expected Result | Status | Evidence | Remarks | Automation
     Tools | Date | Files | Requirement` — the first 17 match spreadsheet
     "FORMAT TEST CASE V4" column for column (don't reorder these), `Files`
     and `Requirement` are this skill's own addition, appended at the end
     rather than interleaved.

  Column definitions:
  - `Group No` — sequential within this PB (`1`, `1`, `1`, `2`, `2`, `3`,
    ...), one number per user-flow/precondition cluster from Step 3.
  - `Feature` — the sub-feature/flow this group belongs to, in Bahasa
    Indonesia, same value repeated for every row in the group.
  - `Process No (FC)` — reference to the flowchart/process step in the
    design spec if the requirement source has one (e.g. "FC 2C.18.9.21 -
    Proses 2"); leave blank if the project doesn't use FC-numbered specs.
  - `TYPE` — `+` for a positive/valid-input scenario, `-` for a
    negative/invalid-input scenario.
  - `Test Case ID` — `TC<Group No>-<sequence within group>`, e.g. group 1's
    cases are `TC1-1`, `TC1-2`, `TC1-3`; group 2's are `TC2-1`, `TC2-2`.
    Not the old `TC-F-01`/`TC-ERR-01` scheme — the category from Step 3 is
    elicitation-only and doesn't appear in the id anymore.
  - `Scenario` — the scenario a group of cases verifies, in Bahasa
    Indonesia (e.g. "Menguji edit order perubahan qty"). In the sheet this
    cell is merged across the group's rows; in markdown write it on the
    group's first row and leave it blank on the following rows of the same
    scenario — an importer forward-fills it, exactly like the merged cell.
  - `Test Case` — short descriptive name of what's being tested, in
    Bahasa Indonesia (this is the tester's "test case name" column — the
    case's title, distinct from `Scenario`).
  - `Pre-Condition`, `Test Data` — in Bahasa Indonesia; keep literal
    values (input strings, URLs, selectors) untranslated.
  - `Test Steps`, `Expected Result` — two separate columns (not merged),
    in Bahasa Indonesia. `Test Steps` = numbered steps joined with `<br>`
    inside the cell (`1. <aksi><br>2. <aksi>`); `Expected Result` = the
    matching numbered outcomes in the same cell layout, same numbering as
    the steps they belong to.
  - `Status` — one of `Progress`, `Passed`, `Failed`, `Re-Test`, `Skip` —
    the V4 sheet's dropdown values plus `Skip` (which the sheet's Summary
    counts), written exactly like that so rows paste into the sheet
    unchanged. A case that hasn't run yet is `Progress` (the sheet's
    default). This is the **only** place completion status lives; update
    this same cell as a case's outcome changes, don't add checkboxes
    anywhere else.
  - `Evidence` — link/path to screenshot, recording, or CI run for this
    case once it's been executed; leave blank until then.
  - `Remarks` — free-text notes in Bahasa Indonesia: blocker, bug ticket
    reference, why a case is skipped, anything that doesn't fit another
    column.
  - `Automation Tools` — exactly one of `Masuk Test Step` (the test step
    itself is automated end-to-end — covered by `react-testing`/
    `e2e-testing`/`webapp-testing` code, link the spec file in `Remarks`
    if known), `Test Data` (automation only seeds/generates the test
    data, execution itself is manual), or `Tanpa Automation` (fully
    manual, no automation involved). Every row gets one of these three —
    there's no separate "Planned" value; a not-yet-automated case is
    `Tanpa Automation` until it is.
  - `Date` — last-executed date, blank until first run.
  - `Files` — source file path(s) this case exercises (from Step 3),
    backtick-quoted, comma-separated if more than one. This is what makes
    the matrix useful when a dependency/file changes: grep this column for
    the changed path to find every test case that needs re-checking.
  - `Requirement` — link to the requirement/acceptance criterion this case
    covers, short description in Bahasa Indonesia if paraphrased.

## Step 5 — Lint, then report gaps

Before reporting anything, run the structural check:

```bash
node scripts/lint-test-matrix.mjs docs/qa/<slug>/test-matrix.md
```

Fix any `ERROR`-level finding (wrong/missing columns, missing Summary
tables — these mean the file doesn't actually match this skill's format)
before moving on. `WARNING`-level findings (bad `Status`/`Automation Tools`
value, `Test Case ID` not matching `TC<n>-<m>`, Summary counts stale, no
traceability index, `Ya`/`Tidak` instead of a checkbox, a file still in the
pre-V4 18-column layout without `Scenario`) are worth fixing too but don't
block — when touching a pre-V4 file anyway, migrate it: insert the
`Scenario` column after `Test Variable`, map emoji statuses to the plain V4
words (`⚪ Not Run`/`🟡 Progress` → `Progress`), and switch traceability to
`[x]`/`[ ]`. Run it with no
arguments (or a directory) to sweep every `test-matrix.md` under the repo
at once — useful for checking a whole program's existing coverage, not just
the file just written.

Then tell the user which `PROGRAM SPECIFICATIONS` rows have no covering
test case (⚠️ Gap in any PB's mini traceability table) and which categories
from Step 3 came up empty for a given PB — those are either genuinely
inapplicable or a sign the requirement source under-specifies that area;
say which you think it is per gap.

## What this skill does NOT do

- Does not write test code or config — hand the finished matrix to
  `react-testing` (component-level), `e2e-testing` (Playwright patterns),
  or `webapp-testing` (executable E2E+TDD workflow) for implementation.
- Does not execute tests or update `Status`/`Evidence`/`Date` itself — those
  columns are for the human/agent running the tests to update as they go.
- Does not decide priority tradeoffs (what P0 actually blocks release) —
  that's a product/eng call; this skill only assigns a starting priority
  per case based on the requirement's stated importance.
