---
name: grill
description: DEFINE stage — turn a Product Backlog item into a confirmed BRD and/or PRD+ISSUES plan through iterative Q&A. Use when starting a planned feature through the repository's grill → dev → qa → gate → promote pipeline.
---

# DEFINE — `/grill`

Treat the text following `/grill` as the Product Backlog item. Produce a written, confirmed plan before code is changed.

1. If no backlog item is provided, ask the user what to plan; do not guess.
2. Check whether the request is a bug or a genuinely small change. For bugs, direct the user to `guides/bug-fix-flow.md`. For a small change that fits in one or two sentences, touches roughly one or two files, and has no new endpoint, schema, or material design decision, point to `guides/small-change-flow.md` rather than creating planning paperwork. Ask if uncertain.
3. Determine whether the user supplied an existing BRD from a business/system analyst. If so, follow the `brd-reader` skill first; it confirms understanding and hands off to `prd-grill`. Do not author a BRD or invoke `prd-grill` a second time after that handoff. If there is no BRD, follow `prd-grill` directly.
4. For `refine <slug>`, pass the refine request to the skill responsible for the existing document.
5. Report the exact paths created (BRD.md and/or PRD.md plus ISSUES.md) and direct the user to `/dev`.

This stage only plans; it does not implement code. Do not use it for a confirmed, still-open plan, which should proceed to `/dev`.
