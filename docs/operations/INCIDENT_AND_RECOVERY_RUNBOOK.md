# Incident and recovery runbook

## Severity

- SEV-1: signing-key compromise, cross-reader data exposure, widespread progress loss, or unsafe content with immediate harm.
- SEV-2: failed content rollout, sustained API unavailability, download/signature regression, or material crash spike.
- SEV-3: contained content defect, degraded diagnostics, or support-impacting defect with a workaround.

## First response

1. Assign incident commander, operations lead, communications lead, and scribe.
2. Preserve logs and immutable artifacts; do not log or copy report bodies, tokens, transcripts, or private keys.
3. Stop the affected rollout or publisher. Rotate credentials immediately if exposure is plausible.
4. Use request ID, app version, platform, content build ID, diagnostic code, and event IDs to reproduce without personal text.
5. Apply the smallest reversible containment: revoke a build, disable publishing, drain a replica, or roll back the service.

## Database recovery

The API SQLite volume is backed up as encrypted snapshots at least daily and before schema or content-promotion work. Target RPO is 24 hours for reports/diagnostics and zero published-package loss because signed packages are immutable artifacts. Target RTO is four hours.

Restore into an isolated environment, run `PRAGMA integrity_check`, verify operational counts, compare package manifests/checksums, and exercise `/ready`. Promote only after a second operator verifies the result. Retention and territorial deletion policy must be approved before public data collection.

## Signing-key compromise

Disable publisher ingress, revoke the key ID and all packages signed after the earliest plausible compromise, issue a new key through the approved custody system, ship the trusted public-key update through a mobile release when required, and do not silently trust a replacement key delivered by the compromised channel.

## Closure

Record impact, timeline, detection gap, root cause, corrective actions with owners/dates, and whether users or regulators require notice. Run a restore and content rollback drill before GA and at least quarterly thereafter.
