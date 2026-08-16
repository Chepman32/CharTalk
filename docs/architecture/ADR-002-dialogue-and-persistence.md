# ADR-002: deterministic dialogue and persistence

- Status: accepted
- Date: 2026-08-13

## Decision

The shared dialogue engine evaluates a declarative allowlisted DSL and returns an immutable turn plan. Repositories apply that plan transactionally. Native durable state uses Expo SQLite with foreign keys and WAL; browser QA uses an equivalent local persistence adapter.

## Invariants

- UI never evaluates content conditions or mutates narrative state.
- No `eval`, dynamic code, raw SQL from content, or runtime model call.
- Transcript text is frozen when shown.
- Event sequence and canonical state hash are monotonic and reproducible.
- The outgoing reply and reaction become visible only after commit.
