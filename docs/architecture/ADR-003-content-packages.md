# ADR-003: content packages

- Status: accepted
- Date: 2026-08-13

## Decision

Authoring produces normalized JSON source. The compiler resolves references, counterfactual signatures, language rules, reachability, safe routes, and content counts, then emits an immutable episode shard with canonical JSON, SHA-256 checksum, and Ed25519 signature. The app imports verified records into a read-only local SQLite content shard.

## Activation protocol

Download to a unique temporary path, enforce byte/space budgets, verify manifest signature and artifact checksum, parse schemas, validate engine compatibility and counts, integrity-check the imported database, dry-run affected migrations, then atomically switch the active build pointer. Keep the previous compatible build for rollback.
