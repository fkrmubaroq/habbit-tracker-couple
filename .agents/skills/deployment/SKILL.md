---
name: deployment
description: Safe release practices when shipping a change to a real environment — pre-deploy checklist, rollback plan, gradual rollout (feature flags/canary), and post-deploy verification. Use when the user asks to deploy, release, ship to production/staging, or plan how a risky change should go out. Not for local git branch management (see branching) or CI pipeline configuration itself — this is about the judgment calls around a release, not the mechanics of any one platform.
license: MIT
metadata:
  category: deployment
  author: lintang
compatible_with: [claude-code, opencode, antigravity, commandcode]
---

# Deployment

Judgment and checklist for shipping a change safely — not a specific
platform's CLI reference. Complements `branching` (which handles how code
moves between branches) by covering the release itself: what to check
before shipping, how to roll out gradually when the change is risky, and
what "done" means after deploy (not just "the pipeline turned green").

## When to use

- The user asks to deploy/release/ship a change to staging or production.
- Planning a rollout for a risky change (data migration, breaking API
  change, large refactor) that needs more than just "push and see".
- Writing a rollback plan before deploying something that's hard to undo.

## When NOT to use

- Just pushing a commit to a regular dev/feature branch with no effect on
  a real environment — that's `branching`.
- Writing/changing CI pipeline files (`.github/workflows/`, etc.) — that's
  its own platform-specific configuration, not this skill's scope (this
  skill is about *what* to check and *how* the rollout should go, not CI
  YAML syntax).
- A trivial, very-low-risk change (typo, text tweak) in a project that
  genuinely auto-deploys with no gate — the full checklist below is
  overkill there, just make sure basic tests pass.

## Steps

1. **Classify the risk before deciding on a rollout strategy.** High risk
   needs gradual rollout; low risk is fine with a direct deploy plus
   monitoring. Signals of high risk:
   - Changes a database schema or involves a data migration (see
     `database-migrations` for its zero-downtime patterns).
   - Changes an API contract that other clients depend on (breaking
     change).
   - Touches a payment path, auth, or sensitive data (see
     `security-and-hardening`/`security-review`).
   - A large change without adequate test coverage in that area.

2. **Pre-deploy checklist** (adapt to the project's actual context, don't
   run it blindly if it isn't relevant):
   - The relevant test suite passes (not just tests tied to the new
     feature — check for regressions in the area touched).
   - Any migration has been reviewed as backward-compatible for the
     transition window (old and new code can run side by side during a
     partial rollout).
   - New environment variables/config are set in the target environment
     *before* the code that needs them is deployed — not after.
   - There's a clear rollback plan (see step 4) worked out before
     starting, not improvised after something breaks.

3. **Gradual rollout for high-risk changes**, not a big-bang push to 100%
   of traffic at once:
   - Feature flag: deploy the code dark, turn it on gradually per
     user/traffic segment, monitoring after each stage.
   - Canary/staged deploy: release to a small slice of instances/traffic
     first, watch error rate and key metrics, then continue to the rest.
   - If the platform/infra supports neither, at minimum deploy to staging
     first and verify before production — don't jump straight to
     production for a high-risk change.

4. **The rollback plan is written BEFORE deploying, not after something
   goes wrong.** For every risky change, have a clear answer: if this
   breaks, what's the fastest way back to a good state — revert the
   deploy, flip off a feature flag, or roll back a migration? Destructive
   migrations (dropping a column, etc.) need special handling because they
   can't be reverted as easily as reverting code — split them into
   backward-compatible stages instead (see `database-migrations`).

5. **Post-deploy verification — not just "the pipeline is green".** A
   green pipeline means the code was deployed, not that the feature
   actually works correctly in the real environment. Check:
   - A smoke test of the main flow touched by this change, in the target
     environment.
   - Error rate/metrics/logs aren't spiking compared to the baseline
     before the deploy.
   - If observability/monitoring is set up (see an
     `observability-and-instrumentation` skill if one exists), look at the
     relevant dashboard — don't just assume no complaints means it's fine.

6. **Report the deploy outcome clearly to the user**: what was deployed,
   to which environment, the result of the verification in step 5, and —
   if the rollout is staged — which stage it's at now and when it moves to
   the next one.

## Actions that need explicit confirmation

Deploying to production, destructive migrations, and rollbacks are all
wide-blast-radius, hard-to-reverse actions — always confirm with the user
before executing, showing the plan (steps 1–4) before running any command
that actually changes a real environment.
