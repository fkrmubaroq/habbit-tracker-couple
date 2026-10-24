---
description: "REVIEW stage — dispatch the review/QA-gate pass and check off the plan's review closing item"
agent: build
---

Pipeline stage: REVIEW. Previous stage /qa, next stage /promote.

Dispatch the review pass for "$ARGUMENTS" — the other half of the closing
gates, deliberately separated from /qa so review and verification can be
run (or batched) independently.

1. Resolve "$ARGUMENTS" to the plan file. Confirm /qa already passed for it
   (its verification closing item is checked) — if not, send the user to
   /qa first; don't review before verification is settled.
2. If "--run-pending" was passed, or multiple plans are sitting verified
   but unreviewed, offer to batch the review pass across them (stack cap
   of 3) — one review call covering every plan in the batch.
3. Dispatch the review: call the "code-review-and-quality" skill
   (`skill({ id: "code-review-and-quality" })`). If the PB touches auth,
   data handling, or anything security-sensitive, also call the
   "security-review" skill.
4. Address blocking findings before proceeding. If the review finds real
   defects, write each blocking finding back into the plan's ISSUES.md as a
   new unchecked "- [ ]" feature checklist item (one per defect, worded as
   the fix to make, not just the finding text) before sending the user to
   /dev. This is required: /dev calls exec-todo, which only acts on
   unchecked feature lines already in the file — if findings aren't written
   there, exec-todo sees everything checked and does nothing, and the user
   gets stuck bouncing between /gate and /dev with no fix happening. Insert
   the new items before the closing checklist items, noting which finding
   each one addresses. Non-blocking notes don't need to be written back —
   only blockers. Then send the user back to /dev, and tell them to re-run
   /qa → /gate afterward since a code fix can invalidate prior
   verification too.
5. Once findings are addressed or accepted, check off the plan's
   review-related closing checklist item(s) for each plan in the batch
   that passed. A batched review can pass one plan and fail another —
   check off per-plan, not the whole batch at once.
6. For each plan that just passed fully (every closing checklist item now
   checked): commit any outstanding changes, then run
   "node .claude/skills/prd-grill/scripts/move-plan.mjs --slug <slug> --to done"
   (per prd-grill's output conventions) instead of moving the files by
   hand — it's a single atomic git mv plus a rewrite of every relative link
   that pointed at the old todo/ path, confirmed necessary because a manual
   file-by-file move can leave an empty todo/<slug>/ directory behind. This
   happens here, not in /promote — the plan counts as "done" once verified
   and reviewed, independent of when
   the branch/release side actually ships.

Not the verification pass — that's /qa, already done before this runs.
Not a way to skip fixing blocking findings to move faster.
