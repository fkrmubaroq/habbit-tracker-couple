---
description: "VERIFY stage — run full E2E/manual verification against the real flows a plan touched"
agent: build
---

Pipeline stage: VERIFY. Previous stage /dev, next stage /gate.

Run the expensive verification pass for "$ARGUMENTS" that /dev deliberately
skipped — this is a conscious, separate step, not an automatic tail of
every /dev run.

1. Resolve "$ARGUMENTS" to the plan file. Confirm every feature item is
   already checked off — if not, send the user back to /dev first, don't
   verify half-finished work.
2. If "--run-pending" was passed, or more than one plan is sitting with
   feature items done but gates unchecked, ask the user whether to batch
   this verification pass across all of them (same batching judgment as
   the exec-todo skill's old Step 3, stack cap 3).
3. Always start with the test-case-matrix skill — every /qa run, not just
   ones with no coverage yet. If docs/qa/<slug>/test-matrix.md already
   exists, read it and only extend it for scenarios it's missing (never
   regenerate from scratch); if it doesn't exist, generate it now from the
   plan's PRD/ISSUES. The matrix is what actually gets verified against —
   it's a required first step of /qa itself, not optional paperwork
   someone has to remember to run separately beforehand.
4. Run this repo's actual E2E/manual verification against the real flows
   the plan touched, following the matrix's checklist order — not just
   unit tests/type-check. Call whichever of the "e2e-testing",
   "react-testing", "webapp-testing", or "api-testing" skills matches what
   this repo/PB actually is. If the tooling isn't available this session,
   say so explicitly — don't skip silently. If a matrix row has no test
   code implemented yet, write it now (same work the qa-engineer agent
   would do, absorbed here so /qa never has to stop and defer to a
   separately-named agent mid-pipeline) — implement it against the matrix
   row, then flip that row's Status cell from [ ] to [V] in
   test-matrix.md as it passes, same convention qa-engineer uses.
5. Write whatever verification report/artifact this repo's convention
   expects, if any. Clean up test data and any dev processes started for
   verification.
6. Check off the plan's verification-related closing checklist item(s)
   (not the review item — that's /gate) once verification passes. If it
   fails, report the failures and send the user back to /dev.

Not the code-review pass — that's /gate, run after this. Not for a plan
whose feature items aren't all done yet. Not a reason to invoke
qa-engineer separately for a plan that's already in this pipeline — /qa
now does matrix creation + implementation itself (Steps 3-4), so
qa-engineer is for ad hoc test coverage requests outside the
/grill→/promote pipeline, not a prerequisite to run before /qa.
