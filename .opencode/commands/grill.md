---
description: "DEFINE stage — turn a Product Backlog item into a BRD and/or PRD+ISSUES via iterative Q&A"
agent: build
---

Pipeline stage: DEFINE. Next stage is /dev.

Turn the Product Backlog item "$ARGUMENTS" into a written, confirmed plan
before any code gets touched.

1. If no argument was given, ask which PB/topic this is for — don't guess.
2. Check for triviality first. If "$ARGUMENTS" is a bug, send the user to
   `guides/bug-fix-flow.md` instead — this pipeline isn't for bugs. If
   it's not a bug but genuinely small (scope fits in one-two sentences,
   touches ~1-2 files, no new endpoint/schema, no real design decision),
   say so and point to `guides/small-change-flow.md` instead of grilling
   it into a full PRD+ISSUES pair — prd-grill itself declines trivial
   one-line tasks, and /dev, /qa, /gate, /promote all require a plan file
   to resolve their argument against, so forcing a trivial PB through
   here just produces paperwork nobody needed. If unsure, ask the user.
3. Decide whether this PB already has a BRD (from a business/system
   analyst — pasted text or a file) that needs reading first, or can go
   straight to implementation planning:
   - Has a BRD: call the "brd-reader" skill (`skill({ id: "brd-reader" })`)
     on "$ARGUMENTS". It hands off to prd-grill itself once the BRD is
     confirmed understood — let that handoff happen, don't call prd-grill
     again separately. It never authors a new BRD.
   - No BRD exists: call the "prd-grill" skill (`skill({ id: "prd-grill" })`)
     directly on "$ARGUMENTS".
   - If unclear which applies, ask the user rather than assuming.
4. If "$ARGUMENTS" looks like `refine <slug>`, pass that through as-is to
   whichever skill owns the existing doc.
5. When the invoked skill finishes, report the exact file path(s) written
   (BRD.md and/or PRD.md + ISSUES.md) and tell the user to run /dev next.

Not the place to write code — both skills only write planning documents.
Not for a PB that already has a confirmed, still-open PRD+ISSUES pair —
that goes straight to /dev.
