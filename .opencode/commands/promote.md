---
description: "SHIP stage — promote a fully-gated plan through branch sync/promotion and close it out"
agent: build
---

Pipeline stage: SHIP. Previous stage /gate. Last stage — nothing follows
this.

Open the PRs that carry "$ARGUMENTS"'s branch forward, now that /qa and
/gate have both passed. This is git-PR mechanics only — no CI/deploy
checks, no waiting on a release to go live. Its plan file is already in
done/ (moved by /gate once review approved).

1. Resolve "$ARGUMENTS" to the plan file. Confirm every closing checklist
   item is checked (feature items from /dev, verification from /qa,
   review from /gate, plan already in done/) — if anything is still open,
   say which stage to run first instead of proceeding.
2. If this repo uses the paired feature-branch + long-lived releases/*
   model (the "branching" skill's own Step 0 detects this):
   - Open a PR from `<slug>-main` into the trunk (main), if one isn't open
     already.
   - Also run the "branching" skill's `sync <slug>` step here
      (`skill({ id: "branching" })`, not as a separate command):
     create/update `<slug>-dev`, cherry-pick the commits not yet picked,
     and open/update a PR from -dev into the staging branch
     (releases/sandbox or releases/staging — check which one this repo
     has per `branching` Step 0; if both exist, ask the user which is the
     real target instead of guessing).
   - That's it — don't check whether merging triggers a deploy, don't look
     for a releases/main push, don't gate on CI.
3. If this repo doesn't use that model, just make sure `<slug>-main`'s PR
   into the trunk branch is open per whatever convention this repo's docs
   describe — still no deploy/CI checks.
4. Offer to clean up branches once the PRs are merged (ask first, don't
   delete unilaterally).

Not a way to bypass /qa or /gate to ship faster — refuse to promote a plan
with open verification or review items, and say so plainly. Not a
deploy/release step — it never checks CI, never touches releases/main,
never waits for anything to go live. Not for shipping more than one plan
file per invocation.
