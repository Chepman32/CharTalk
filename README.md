# CharTalk

CharTalk is a Russian-first, local-first mobile interactive-fiction app. Every decision presents exactly four authored replies. A deterministic engine applies the selected reply, records its consequences atomically, and resolves the next authored state without runtime text generation.

## Workspace

- `apps/mobile` — Expo SDK 57 reader app for iOS, Android, and a browser QA target.
- `apps/content-studio` — narrow editorial workflow, preview, validation, and package publishing UI.
- `services/api` — catalog, signed-package delivery, content reports, and optional sync protocol boundary.
- `packages/content-schema` — executable story and package contracts.
- `packages/dialogue-engine` — pure deterministic resolver and replay logic.
- `packages/content-compiler` — graph, counterfactual, language, package, and capacity validators.
- `packages/content-integrity` — canonical hashing, signature verification, and template validation shared across install boundaries.
- `packages/design-system` — semantic design tokens shared by native and web surfaces.
- `packages/test-fixtures` — bundled Russian sample content, a deterministic 240-story bulk fixture (12,000 decisions / 60,960 reachable nodes, with at least 50 choice points on every route to an ending), and deterministic saves. Every story in the reader catalog is bundled for immediate offline reading; bulk content is fixture-only until editorial approval.

## Requirements

- Node.js 22.13 or newer.
- npm 11.
- Xcode/Android Studio for native builds.

## Start

```bash
npm install
npm run dev:mobile
```

Other surfaces:

```bash
npm run dev:api
npm run dev:studio
```

The API contract is in `services/api/openapi.yaml`. Production deployment uses the root `Dockerfile`; it requires a mounted signed content package, public key, content-asset root, writable database volume, and a high-entropy admin token. For separated editorial permissions, set `CHARTALK_CMS_WRITER_TOKEN`, `CHARTALK_CMS_EDITOR_TOKEN`, `CHARTALK_CMS_QA_TOKEN`, and `CHARTALK_CMS_PUBLISHER_TOKEN`; validation accepts writer/editor/QA/publisher tokens while publication accepts publisher only. Ordinary serving replicas keep publishing disabled. A publisher additionally requires `CHARTALK_SIGNING_PRIVATE_KEY_FILE` and `CHARTALK_SIGNING_KEY_ID`; publication also requires the exact build ID in `X-CharTalk-Confirm-Build-Id`.

Content media is mounted at
`$CHARTALK_CONTENT_ASSET_ROOT/<url-encoded-pack-id>/<url-encoded-build-id>/<asset.path>`.
Mobile releases should carry `EXPO_PUBLIC_CHARTALK_CONTENT_PUBLIC_KEYS` as a JSON map of trusted key IDs to base64url Ed25519 public keys so old and new keys can overlap safely during rotation.

Android release builds are fail-closed: CI must provide
`CHARTALK_ANDROID_KEYSTORE_FILE`, `CHARTALK_ANDROID_KEYSTORE_PASSWORD`,
`CHARTALK_ANDROID_KEY_ALIAS`, and `CHARTALK_ANDROID_KEY_PASSWORD` from its
secret manager. `CHARTALK_ALLOW_DEBUG_SIGNING=true` is reserved for local
standalone smoke APKs and must never be used for store submission.

## Verification

```bash
npm run verify
npm run test:content:bulk
npm run test:content:scale
npm run partition:content -- input.json artifacts/content-shards
npm run test:e2e
npm run test:container:contract
# With a built Release APK and a connected emulator/device:
npm run test:android:smoke -- --require-device
# On a macOS host with Xcode and an available iOS Simulator:
npm run test:ios:project -- --require-xcode
npm run test:ios:build
```

`npm run verify` checks formatting, lint, strict types, embedded secrets, coverage, dialogue-engine mutation score, content invariants, capacity budgets, and production builds. `npm run test:e2e` also proves the core reader path after the browser is switched offline. Native release checks and signed human editorial evidence are tracked in [`docs/product/RELEASE_EVIDENCE.md`](./docs/product/RELEASE_EVIDENCE.md); the full AC disposition is in [`docs/product/PDS_REQUIREMENT_AUDIT.md`](./docs/product/PDS_REQUIREMENT_AUDIT.md).

To publish a large catalog as independently downloadable shards, use the
deterministic partitioner with a production key. It refuses unsigned output and
re-runs the production gate before writing any shard:

```bash
CHARTALK_SIGNING_PRIVATE_KEY_FILE=/secure/key.pem \
CHARTALK_SIGNING_KEY_ID=prod-2026-q3 \
CHARTALK_MAX_STORIES_PER_SHARD=50 \
npm run partition:content -- input.json artifacts/content-shards
```

Fixture-only local output can be inspected with
`CHARTALK_ALLOW_UNSIGNED_SHARDS=true`; those shards retain pending signatures
and cannot be activated by a production publisher.

The reader also ships the bulk fixture as five checked-in, story-owned local
shards (at most 50 stories each, each below the 50 MiB package budget). They are
imported into the native/web bundle and never downloaded at runtime; the
combined JSON remains available to reporting tools. The default mobile bundle
ships all 243 stories in its catalog (the authored sample plus the 240-story
fixture) for immediate offline reading.

The Android standalone smoke harness verifies the native four-choice accessibility
contract, immediate commit after an option tap, and force-stop recovery at waiting
and committed turn boundaries. It intentionally uses the explicit debug-signing
opt-in only for local/emulator evidence; production signing remains fail-closed.

The iOS Release build command emits an unsigned Simulator artifact for local
verification. The same artifact was installed, launched, terminated, and
relaunched on an iPhone 17 Pro simulator; store/device signing and VoiceOver
approval remain release-owner gates.

`npm run test:container:contract` verifies the production Dockerfile stays aligned
with every workspace dependency, uses a non-root runtime, and declares its
durable volumes and readiness healthcheck. CI also builds the tagged image on
every pull request and push; a running production container still requires the
signed package, public key, asset mount, and secret configuration described
above.

The reader includes atomic replayable SQLite migrations, stable entry-ID
transcript resume with a bounded UI window, explicit persisted 100/150/200%
text modes, reduced-motion instant reveal, and a vertically scrollable
four-choice tray. These paths are part of the automated unit, capacity, and
phone-profile E2E gates.

Catalog discovery is cache-first: the mobile client revalidates the public
metadata envelope with ETag, keeps the last known catalog in SQLite/localStorage
when the network is unavailable, and requires the matching signed exact build
before a newly discovered story can be started.

Security posture, the locally patched upstream image-parser advisories, dependency exceptions, accessibility evidence, and operator runbooks live under `docs/security`, `docs/quality`, and `docs/operations`. Remote mobile services and Studio publication require HTTPS; exact loopback HTTP endpoints are accepted only for local development.

## Product truth

The PDS remains the source of product requirements. [`DECISIONS.md`](./DECISIONS.md) records implementation defaults for its open questions. Synthetic fixtures, generated art, and test data are explicitly marked; they are not counted toward the PDS human-approved GA content gate.
