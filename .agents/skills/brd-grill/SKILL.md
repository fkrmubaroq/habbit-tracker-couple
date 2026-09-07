---
name: brd-grill
description: Use when the user wants to turn a rough Product Backlog item into a Business Requirements Document (BRD) through iterative Q&A — triggers on "/brd-grill", "buatkan BRD", "grill jadi BRD", "bikin BRD dari backlog ini", or when a backlog item needs formal requirements documentation before implementation planning. Asks one question at a time about process flow, UI, and data-dictionary impact, then writes a structured BRD file, optionally with a calibrated effort-estimate table. Hands off to the prd-grill skill afterward to turn the BRD into an implementable checklist/todo. Not for writing implementation-level checklists directly (use prd-grill for that) and not for backlog items that already have an approved BRD (use the refine flow instead).
license: MIT
compatibility: "Requires a way to write files and, ideally, an AskUserQuestion-style tool for choice questions."
metadata:
  category: planning
  author: lintang
  version: "1.0.0"
allowed-tools: [Read, Write, Edit, Glob, Grep, AskUserQuestion, Skill]
argument-hint: "[nama product backlog] | refine <slug>"
when_to_use: "Also trigger when the user pastes a raw Product Backlog description and asks for requirements/analysis before any implementation planning has happened."
disable-model-invocation: false
user-invocable: true
model: inherit
effort: medium
compatible_with: [claude-code, opencode, antigravity, commandcode]
---

# /brd-grill

Turn a rough Product Backlog item into a **Business Requirements Document
(BRD)** through the same one-adaptive-question-at-a-time grill discipline as
[`prd-grill`](../prd-grill/SKILL.md) — then hand off to `prd-grill` to turn
the finished BRD into an implementable checklist/todo. This skill produces
the *requirements/analysis* artifact; `prd-grill` produces the
*implementation plan* artifact. Don't blur the two: a BRD documents what the
business needs and the process/data impact; a phase-plan/PRD from
`prd-grill` documents how it gets built.

## Usage

```
/brd-grill <nama product backlog>     # start grilling directly
/brd-grill                             # ask what backlog item this is for
/brd-grill refine <slug>               # reopen an existing BRD, grill only the delta
```

## Step 0 — Detect the repo's BRD convention

Before asking anything, check quickly (Glob, don't guess) whether this repo
already has BRD documents (`doc/brd/`, `docs/BRD/`, or similar) or a BRD
template. If prior BRDs exist, read 1-2 to learn this repo's exact section
names and structure — follow that instead of the default template below.
If none exist, use the default structure in `references/brd-template.md`.

## Step 1 — Scope: new BRD vs. refine an existing one

Ask (or infer) whether this is a brand-new BRD or a refinement of one
already written for this backlog item (same discipline as `prd-grill` Step
1 — recognize a refine from intent, not just the literal `refine` keyword).

## Step 2 — Grill loop: one question at a time

Ask exactly one question per turn, prefer a choice-style tool for
yes/no or small-option questions, plain text for open-ended ones. Adapt
each next question to prior answers — skip anything already obvious from
the backlog text itself.

Ground to cover (skip what's already answered):
- **Backlog understanding** — what is being requested, in the requester's
  own terms; don't paraphrase into implementation language yet.
- **Process/flow impact** — does this change an existing business process
  flow, or is it isolated (e.g. a copy/label change)? This determines
  whether flowchart/workflow sections are needed at all.
- **UI impact** — does this touch existing screens/forms, or add new ones?
  If yes, which ones by name/ID (this matters later for effort estimation
  — see `references/effort-estimation.md`).
- **Data dictionary impact** — does this add/change stored data fields?
- **Complexity signal** — don't ask "what's the complexity" directly (the
  agent should assess this itself per
  `references/effort-estimation.md#complexity-calibration`); instead ask
  concrete questions whose answers let the agent *derive* complexity (how
  many separate changes, does it touch external integrations, is it a new
  module vs. an edit to an existing one).
- **Out of scope** — ask directly what's explicitly NOT part of this BRD.

Never batch unrelated questions into one turn. If an answer contradicts an
earlier one, surface it and ask which stands.

## Step 3 — Confirmation

Summarize understanding (backlog interpretation, process/UI/data impact,
scope, complexity assessment) and get explicit confirmation before
generating the BRD file. Loop back to Step 2 for anything corrected.

## Step 4 — Generate the BRD

Write the file following `references/brd-template.md` (or this repo's own
convention if Step 0 found one). Always include:
- A clear statement of the backlog item this BRD covers
- Process/workflow section (or an explicit "no flow change" note if Step 2
  established there's none — don't leave it silently blank)
- UI section (or an explicit "no UI change" note)
- Data dictionary section (or an explicit "no data change" note)
- Out of scope, explicit

**Optional effort-estimate table:** if the user wants a work-hour estimate
alongside the BRD (common when this feeds a planning/scheduling process),
follow `references/effort-estimation.md` — it documents a calibrated
7-step estimation rubric with a strict rule hierarchy (see that file before
estimating; getting the complexity calibration wrong is the most common
failure mode here, specifically over-rating a bundle of small requests as
high complexity).

Write the file directly — tell the user the exact path afterward.

## Step 5 — Hand off to prd-grill

Once the BRD is confirmed, ask the user whether to immediately continue
into [`prd-grill`](../prd-grill/SKILL.md) to turn it into an implementable
checklist/todo. If yes, invoke that skill and pass it:
- The BRD file path just written (so it reads full context instead of
  re-deriving it)
- The process/UI/data-impact answers already gathered in Step 2, so
  `prd-grill`'s own grill loop doesn't re-ask what's already known —
  it should only ask what's genuinely new (implementation-level detail: which
  files, which endpoints).

Don't let `prd-grill` re-litigate scope decisions already confirmed in this
BRD — the BRD is the source of truth for *what*, the todo/plan is for *how*.

## Step 6 — Refinement loop

Same discipline as `prd-grill` Step 7: if this repo edits BRDs in place,
update in place with a short changelog note; if this repo treats BRDs as
append-only/versioned (matches Convention B in
`../prd-grill/references/output-conventions.md`), write the next version
instead of editing.

## What this skill is not

- Not an implementation planner — that's `prd-grill`'s job, always hand off
  rather than duplicating checklist generation here.
- Not a substitute for actually validating the BRD with the business/
  requester — this skill drafts it, a human still needs to approve it
  before it's treated as final.
- Not for editing code.
