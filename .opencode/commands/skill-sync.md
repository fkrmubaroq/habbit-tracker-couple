---
description: "Check installed skills/agents/commands against their source and update the ones that changed upstream"
agent: build
---

Sync installed skills/agents/commands in this project against the catalog
they came from, using the "skill-sync" skill
(`skill({ id: "skill-sync" })`).

1. Apply the "skill-sync" skill's steps in order: locate the lockfile(s)
   and confirm scope (project/global/both — ask if both exist), ask which
   tracked skills/agents to sync via an interactive checklist (or just
   "$ARGUMENTS" if a specific skill/agent name was given), resolve and
   pull the source, then classify and sync the selected files.
2. `--rebuild-lock` in "$ARGUMENTS" forces the "no lockfile found" path
   even if one exists, in case it's known to be stale — confirm with the
   user before discarding an existing lockfile.
3. Never overwrite a file classified as a project-scoped override without
   explicit confirmation.
4. Report one summary at the end: which scope(s) synced, up to date /
   auto-updated / kept as override / unresolved conflicts.

Not the initial install — that's INSTALL.md. Not a way to force-overwrite
customizations without asking.
