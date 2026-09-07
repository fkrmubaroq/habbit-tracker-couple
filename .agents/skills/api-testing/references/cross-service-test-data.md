# Cross-service test data — the "provider contract" problem

## The problem

A test in repo A needs data whose creation logic actually lives in repo B
(a separate service). Example: repo A tests "cancel order," but "create
order" is owned by an order-service that lives elsewhere. If repo A's test
doesn't know order-service's real rules, it has two bad options:

1. Guess the shape of a valid order and insert it directly into the shared
   database.
2. Guess the shape of order-service's API and mock it.

Both guesses can look "valid" and still be wrong, because they're not
grounded in order-service's actual constraints, triggers, computed fields,
or state machine — the test passes for the wrong reason, and breaks in
production when the guess and reality diverge.

## What to ask for instead ("provider contract")

The term for what you're missing is the **provider contract** — the actual,
authoritative definition of how the owning service creates/validates this
entity. Get it in one of these forms, in order of preference:

1. **The other repo's source, made available as a working directory** — the
   test can then seed data through that repo's real creation path (call its
   internal function, run its own seed script, or spin up its own
   dev server and hit its API) instead of guessing.
2. **Its API contract** — an OpenAPI/Swagger spec or Postman collection.
   Seed by calling the real endpoint it documents, even if only to produce
   fixture data for repo A's test — not by reverse-engineering the shape
   from repo A's side.
3. **A reachable staging/dev endpoint** for that service, plus test
   credentials. Slowest and most fragile (network dependency, shared
   state), but still grounded in the real service rather than a guess.

If none of the three exist, stop and say so plainly — don't fall back to
inserting into a shared table or hand-writing a mock schema from memory.
This mirrors the "don't guess, ask" convention used elsewhere in this
skill collection (e.g. `exec-todo`'s Step 0 refusing to guess which plan
file to execute, `project-bootstrap` detecting stack instead of assuming
it).

## Why not just mock it and move on

A mock built without a contract to check it against goes stale silently —
it keeps returning what it always returned, even after the real service's
API changes shape, so the test keeps passing while the integration is
actually broken. A mock built *from* an OpenAPI spec or Postman collection
at least fails loudly when that spec is regenerated and no longer matches.
This is the same reasoning behind **consumer-driven contract testing**
(e.g. Pact) in the broader testing world, without requiring you to adopt
that whole toolchain — the minimum viable version is: don't write a mock
you can't trace back to a real contract document or real code.

## Why not insert directly into another service's tables

Even with read access to the shared database, a row that satisfies the
*schema* can still violate the *service's actual invariants* — a status
field that's supposed to only be set by a state-machine transition, a
derived total that's supposed to be computed and stored by application
code, a trigger that fires side effects (notifications, ledger entries)
that a raw insert skips. The row looks fine in a `SELECT *` and still
represents a state the real service would never produce. Seeding through
the owning service's real path avoids this entirely — the only exception is
when that repo ships its own official seed script, because that script *is*
the owning service's blessed way of producing fixture data.
