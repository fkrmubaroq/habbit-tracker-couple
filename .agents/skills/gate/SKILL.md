---
name: gate
description: REVIEW stage — review a plan after QA verification, address blocking findings, and check off its review closing items.
---

# REVIEW — `/gate`

Treat the text following `/gate` as the plan path, slug, or identifier. Confirm the plan's verification closing item is checked before reviewing; otherwise direct the user to `/qa` first.

1. Follow the `code-review-and-quality` skill to review the changes. For authentication, sensitive data handling, or other security-sensitive changes, also follow `security-review`.
2. If there are blocking findings, write each fix as a new unchecked feature item in the plan's `ISSUES.md` before directing the user to `/dev`. After fixes, the user must rerun `/qa` and `/gate`.
3. Once blocking findings are addressed or accepted, check off the review closing item(s) for the plan.
4. When every closing item is complete, move the plan to `done` using the repository's `prd-grill` move-plan convention. Do not move an incompletely gated plan.

Report the verdict and direct the user to `/promote` only after the review passes. Do not treat this stage as a substitute for `/qa`.
