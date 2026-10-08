---
name: qa
description: VERIFY stage — run the full E2E/manual verification for a completed plan, using its test-case matrix and the appropriate repository testing skills.
---

# VERIFY — `/qa`

Treat the text following `/qa` as the plan path, slug, or identifier. Resolve it and confirm all feature checklist items are complete before verification; if not, direct the user back to `/dev`.

1. Always use the `test-case-matrix` skill first. Read and extend the existing `docs/qa/<slug>/test-matrix.md` when present; otherwise create it from the plan's requirements.
2. Verify the real flows affected by the plan against the matrix, following its checklist order. Use the appropriate available testing skill (`e2e-testing`, `react-testing`, `webapp-testing`, or `api-testing`). Do not silently skip verification if tooling is unavailable.
3. Implement missing test coverage represented by matrix rows and update each row's status as it passes.
4. Write the verification report expected by the repository, clean up test data and any verification processes, then check off the plan's verification closing item(s) if verification passes.

If verification fails, report the failures and direct the user to `/dev`. After a successful verification, direct the user to `/gate`. This command is for one plan at a time; if the user asks to batch plans, confirm the scope first.
