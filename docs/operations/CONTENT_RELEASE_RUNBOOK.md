# Content release and rollback runbook

## Preconditions

1. Freeze the candidate build ID and source revision.
2. Obtain signed editorial, continuity, safety, accessibility, and rights evidence.
3. Run `npm run validate:release`; the production gate must report zero compiler blockers, zero non-approved nodes, zero fixture assets, and all PDS scale floors met.
   `npm run test:content:bulk` is a development-scale smoke check only; its generated fixture must never be promoted as approved inventory.
4. Run deterministic traversal, tamper, compatibility, and minimum-device offline tests.
5. Have two named people approve publication; neither may be the sole author of the candidate.

## Sign and publish

Use an isolated publisher with no public ingress. Mount the private key read-only for the signing operation; never place it in an environment value, repository, build artifact, or application log. Set a stable `RAZVILKA_SIGNING_KEY_ID`, type the exact immutable `buildId` in the studio, and submit it as `X-Razvilka-Confirm-Build-Id`; aliases such as `latest` are rejected. Publish the immutable package, verify its returned manifest, key ID, and checksum from a separate serving replica, then promote catalog metadata.

Package media uses this immutable layout:
`$RAZVILKA_CONTENT_ASSET_ROOT/<url-encoded-pack-id>/<url-encoded-build-id>/<asset.path>`.
The publisher verifies every regular file, MIME, byte limit, and SHA-256 digest before signing.

Roll out 1% → 10% → 50% → 100%, holding long enough to observe download success, signature failures, content-error reports, crash-free sessions, and completion. Do not mutate a published build. Corrections receive a new build ID.

## Automated stop/rollback triggers

- signature or checksum failure above zero for a correctly downloaded artifact;
- crash-free sessions below 99.5% or a material ANR regression;
- package download success below 98%;
- confirmed blocker, unsafe route, broken reachable node, or silent progress loss;
- readiness failure or elevated API 5xx sustained for five minutes.

On trigger: stop catalog promotion, mark the candidate revoked, reactivate the last known-good compatible build, preserve runs pinned to their exact installed build, and notify support. Never delete the only build needed to replay an existing run.

## Verification after rollback

Confirm catalog ETag, manifest build ID, signature, download, offline start, exact-build resume, and branch replay on iOS and Android. Record timestamps, affected builds, metrics, decision owner, and user communication in the incident record.

## Signing-key rotation

1. Generate the replacement Ed25519 key in managed key custody and assign a new immutable key ID.
2. Ship a mobile trust map containing both old and new public keys; do not publish content with the new key until the overlap build is supported.
3. Deploy serving and publisher configuration for the new key ID, then publish a staged candidate signed by the new private key.
4. Verify old installed content with the old key and new content with the new key on both platforms. An unknown key ID must fail closed without changing the active package.
5. Revoke the old publishing key. Remove its public key only after the supported-client window and every retained exact-build replay requirement have expired.
6. Record key IDs, custody approvals, client coverage, test builds, timestamps, and revocation evidence. A suspected compromise skips normal staging and follows the incident runbook.
