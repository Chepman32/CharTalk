# ADR-004: network and identity boundaries

- Status: accepted
- Date: 2026-08-13

## Decision

The first reader release is guest-first and has no payments or required account. The API exposes public cacheable catalog/package discovery and consented content-report ingestion. Append-only sync schemas and canonical replay are implemented behind a disabled capability flag for a later identity-provider decision.

## Security consequences

- Mobile public configuration contains no secrets.
- Publisher operations require authenticated, authorized server-side access and are off by default.
- Client-computed effects, prices, entitlements, and state hashes are never authoritative.
- Raw dialogue and complete trajectories do not enter general product analytics.
