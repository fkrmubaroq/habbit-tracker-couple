---
description: "BUILD stage — implement a confirmed plan's checklist items (no closing gates)"
agent: build
---

Pipeline stage: BUILD. Previous stage /grill, next stage /qa.

Implement the checklist in "$ARGUMENTS" (path, slug, or number). Call the
"exec-todo" skill (`skill({ id: "exec-todo" })`) directly with that
argument — it already implements exactly this scope: resolve the file,
parse feature items into a tracked task list, implement each with cheap
checks only (unit tests/type-check/build), and stop once every feature item
is checked off. It does not dispatch review or run full E2E verification
itself.

exec-todo stops on its own once every feature item is checked off — it
never moves the file to done/ or runs the expensive gates. Relay its final
report, then tell the user the closing gates (/qa → /gate → /promote) are
next.

Not /qa or /gate — cheap per-item checks run here, but the expensive
E2E/manual verification pass and the code-review pass are separate
commands, run deliberately. Not for more than one plan file per invocation.
