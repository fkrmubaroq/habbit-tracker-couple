# Template README (multi-PB board)

```md
# PB xxx - Project Title
> Owner: @owner | Written by: name/date | Updated: date | Status: Draft/Ready/In Progress

## PB List

| PB | Title | Status | Active Wave |
|----|-------|--------|-------------|
| 1.952.10 | Report title | In Progress | W2 |
| 1.952.6.1 | Filter title | Todo | W0 |

## How We Work (Waves)

- W0 foundation -> W1 backend -> W2 frontend -> W3 QA/deploy.
- Waves run sequentially. Parallel work inside one wave is allowed.
- Cross-PB parallelism is allowed unless the same repo or database is shared.

## Affected Repos

| Repo | Used by PB | Work branch | Base |
|------|------------|-------------|------|
| `org/backend-xxx` | 1.952.10 | `feat/<slug>-main` | `main` |
| `org/frontend-xxx` | 1.952.10 | `feat/<slug>-main` | `main` |

## PB 1.952.10 Detail

Context, scope, formulas, decisions, open questions.

## PB 1.952.6.1 Detail

Context, scope, decisions, open questions.

## References

Links to Asana, Drive, Sheets, analysis docs.

## Open Questions

1. Question with owner and due date.
```
