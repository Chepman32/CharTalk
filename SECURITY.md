# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Send a minimal report to `security@chartalk.app` with the affected version, reproduction steps, impact, and whether user data or signing material may be exposed. Do not include real reader transcripts or credentials.

The production owner must acknowledge a report within two business days, assign severity, preserve evidence, and follow the incident runbook. Public disclosure is coordinated after a fix or compensating control is available.

## Supported versions

Only the current mobile release, current content schema, and current API release receive security fixes. Installed content keeps the current and two previous compatible minor versions for safe replay and rollback.

## Security invariants

- No runtime language model, user-authored story text, or executable content.
- Every installed content package is schema-checked, checksummed, and Ed25519-signature verified before atomic activation.
- Production publishing is disabled unless an explicit flag and file-mounted private key are both present.
- Admin access requires a high-entropy bearer secret and must terminate behind TLS and an identity-aware gateway.
- Reports and diagnostics accept strict allowlists; raw dialogue, display names, grammatical profile, and full trajectories are never analytics fields.
- The local database contains story progress but no account credential or production signing secret.

## Release checks

Run `npm run verify`, `npm run test:e2e`, `npm run security:secrets`, and `npm audit --audit-level=critical`. Review time-bounded transitive findings in `docs/security/DEPENDENCY_EXCEPTIONS.md`; never apply `npm audit fix --force` without a compatibility and threat-model review.
