---
name: promote
description: SHIP stage — promote a fully verified and reviewed plan through the repository's branch/PR flow; does not deploy or wait for CI.
---

# SHIP — `/promote`

Treat the text following `/promote` as the plan path, slug, or identifier. Confirm the plan is in `done/` and all feature, verification, and review closing items are checked. If any gate is incomplete, direct the user to the appropriate earlier stage and stop.

Follow the `branching` skill to detect the repository's branch model. Open or update the PR(s) required by that model. For paired feature branches and long-lived `releases/*` branches, open the feature-to-trunk PR and run the branching skill's sync step for the staging branch; if the staging target is ambiguous, ask the user.

For other branch models, follow the repository's documented PR convention. Do not check or wait for CI, trigger deployment, or claim that this command releases to production. Ask before deleting any branches.
