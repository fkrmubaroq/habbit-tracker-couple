# Standard Views

`gh project` has no `view-create` command. Create views manually
via web or GraphQL. Every board must have these four views.

## 1. All Work Items (TABLE)

No filter. Full list for audit.

## 2. Engineering Workflow (BOARD)

Grouped by `Status`: Backlog, Ready, In Progress, Done.

## 3. Delivery Roadmap (ROADMAP)

Plotted by `Target Date`. Used for wave planning.

## 4. Development Sequence (TABLE)

- Filter: `-delivery-stage:Tracking` (hides umbrella and parent containers).
- Sort: `Delivery Stage` S0-S5, then `Target Date`.
- Visible columns: Title, Status, Application, Delivery Stage,
  Estimate, Target Date, Owner, Repository.

This is the execution order for developers and agents.
Backlog to Ready promotion stays manual by the project maintainer.
