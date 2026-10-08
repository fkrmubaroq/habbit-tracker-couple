---
name: github-projects
description: Use when the user wants to create or manage a GitHub Projects board (org knittotextile), write a multi-PB README, create issues with 3-scope format, plan waves, set dependencies, or create standard views. Triggers on "create project board", "buat board PB", "add issue to project", "create development sequence view". Not for git branching (see branching) or Asana tasks.
license: MIT
compatibility: "Requires gh CLI auth with project scope"
metadata:
  category: git-workflow
  author: knitto
  version: "1.0.0"
allowed-tools: [Bash, Read, Grep, Glob]
disallowed-tools: []
argument-hint: "create <PB> | add-issue | add-view"
when_to_use: "Also trigger when user mentions PB board, README board, 3-scope issue, wave, or project views."
disable-model-invocation: false
user-invocable: true
effort: medium
compatible_with: [claude-code, opencode, antigravity]
---

# github-projects

One board can contain more than one PB. The board is the source of truth.
The README is the contract. An issue is the execution unit for AI and human.

## When to use

- Create a new Projects board for one or more PBs.
- Write or update the board README (multi-PB).
- Create issues with the 3-scope format.
- Plan waves for large features.
- Set dependencies between waves and issues.
- Create the standard views (including Development Sequence).

## When NOT to use

- Git branch management (use `branching`).
- Code implementation itself (use `exec-todo`, `incremental-implementation`).
- Asana task management.

## Step 0 - Verify via gh

1. `gh auth status` must show the `project` scope.
2. `gh project list --owner knittotextile` to check existing boards.
3. `gh project view <number> --owner knittotextile --format json` to read README, fields, items.

Never use web scraping for project data. Always use `gh`.

## Step 1 - Clarify until scope is complete (mandatory)

Do NOT create a board or issues if any item below is missing.
Ask iteratively until all answers are complete. Do not guess.

1. PB list: PB IDs and titles (one board may hold N PBs).
2. Owner and author: who owns the board, written by name/date.
3. Affected repos: repo, role, work branch, and base (ship target) per PB.
4. Wave plan: W0 foundation, W1 backend, W2 frontend, W3 QA/deploy, or custom.
5. Per issue: Definition, Changes, Success criteria (must include Test), Dependencies.

If an answer is vague, ask again with a concrete example.
Only proceed when every point has an explicit answer.

## Step 2 - README (multi-PB)

See `references/template-readme.md`. Required blocks:

- Header: Owner, Written by, Updated date, Status.
- PB list table: PB, Title, Status, Active wave.
- How we work: wave order and parallelism rules.
- Affected repos table: Repo, Used by PB, Work branch, Base.
- Detail section per PB: context, decisions, open questions.

## Step 3 - Issue 3-scope format

See `references/template-issue.md`. Every issue must contain:

1. Definition: feature/problem, context, and out-of-scope.
2. Changes: files, endpoints, or UI changes, plus repo and branch.
3. Success Criteria: Functional checkbox, Test checkbox (mandatory), Regression checkbox.

Header line: `Wave: Wx | Repo: org/repo | Branch: <branch> | Depends: <ids> | Blocks: <ids>`.
An issue without a Test block is NOT Ready.

## Step 4 - Waves and dependencies

- Waves run sequentially. Parallel work inside one wave is allowed.
- Cross-PB parallelism is allowed unless they share the same repo or database.
- Rule: if Depends is not Done, the issue stays in Todo/Backlog and must not start.
- Record dependencies in the issue body (`Depends:`) and in project fields (`Status`, `Delivery Stage`).

Use waves whenever a feature is too large for a single issue.

## Step 5 - Standard views

`gh project` cannot create views. Create them manually via web or GraphQL.
Every board must have these four views (see `references/views.md`):

1. All Work Items (TABLE).
2. Engineering Workflow (BOARD grouped by Status).
3. Delivery Roadmap (ROADMAP by Target Date).
4. Development Sequence (TABLE, filter `-delivery-stage:Tracking`, sorted by Delivery Stage S0-S5 then Target Date).

## References

- `references/template-readme.md` - multi-PB README skeleton.
- `references/template-issue.md` - 3-scope issue skeleton with Test block.
- `references/views.md` - standard view definitions including Development Sequence.
