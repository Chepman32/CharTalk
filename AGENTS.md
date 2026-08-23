# CharTalk engineering handbook for coding agents

This file applies to the entire repository. It is both a project orientation and
an execution contract for agents changing CharTalk. Read it before editing code,
content contracts, native projects, release tooling, or product documentation.

## 1. What CharTalk is

CharTalk is a Russian-first, local-first mobile interactive-fiction reader. It
uses the familiar rhythm of a private chat while retaining the determinism,
authorship, continuity, and testability of a visual novel.

At every reachable nonterminal decision, the reader sees exactly four authored
replies. A selected reply has three meaningful consequences:

1. It produces a choice-specific immediate reaction.
2. It changes the next four-choice state or reaches a distinct terminal outcome.
3. It writes a choice-specific memory or state consequence that is consumed by
   later content or an ending.

All story text is authored in advance. There is no runtime text generation,
free-text chat, hidden LLM call, or executable user-authored content. Given the
same signed content build, initial state, and choice sequence, the engine must
produce the same transcript and canonical state hash.

The short product promise is:

> Выбирай, что ответить. Персонажи запомнят. История изменится.

CharTalk is not an AI companion, dating service, messenger with real people,
social network, therapy product, or infinite conversation simulator. Do not add
copy or behavior that obscures the authored and fictional nature of the product.

## 2. Product conception and design philosophy

The central hypothesis is that four carefully authored replies can create real
agency when their intentions are distinct, the character reacts specifically,
and downstream consequences remain visible and coherent.

Use these principles when making product or content decisions:

- Specificity beats simulated profundity. Remember a concrete promise, delay,
  boundary, clue, or action instead of expressing generic emotional intensity.
- A reply is an action. It should communicate a recognizable intention such as
  support, curiosity, humor, distance, honesty, deception, confrontation, or a
  boundary.
- Characters do not exist only to reward the reader. They may disagree, be busy,
  maintain relationships outside the player, and refuse unreasonable behavior.
- Consequences should be legible without exposing a numerical optimization game.
  Relationship values remain hidden; recaps use qualitative changes and facts.
- Russian is source language, not a translation layer. Avoid translated syntax,
  synthetic slang, romance clichés, and advertising voice.
- Mobile pacing matters. One bubble should normally carry one thought, action, or
  intentional pause.
- Offline is a normal mode, not an error state. Installed or bundled stories must
  not depend on the network for individual choices.
- Content is executable product. It is versioned, validated, tested, signed,
  activated atomically, retained for replay, and rolled back like code.
- Safety routes are authored alternatives, not punitive shortcuts. Skipping a
  sensitive scene must not silently force a worse relationship or ending.
- Accessibility is part of the core reader path, not a post-release overlay.

## 3. Current product scope and intentional non-goals

The implemented reader is guest-first and complete without an account. Current
scope includes onboarding, a bundled catalog, character/story details, the
four-choice reader, provisional choice, durable resume, recap, branches,
archive, appearance and reading preferences, content controls, local export and
deletion, reports, optional signed content update infrastructure, and local
weekend reading reminders.

The default mobile bundle contains all 243 currently exposed stories for
immediate offline use. The authored sample and generated bulk fixture are both
present in development, but fixture content and generated art do not count as
human-approved launch inventory.

Current catalog UX decisions are deliberate:

- The home catalog has no pagination or “show more” control.
- Embedded stories do not display “offline” badges; offline availability is the
  default, not an exceptional card state.
- Story cards and the home catalog do not expose download buttons.
- The home catalog does not show manual “update catalog” or “manage updates”
  controls.
- Filtering opens a sheet with explicit selectable values. Do not replace it
  with chips that cycle through hidden options.
- Signed update and recovery infrastructure may remain elsewhere, but it must
  not make bundled reading appear network-dependent.

The following remain non-goals unless a new dated decision explicitly changes
them:

- free-text or voice conversation;
- runtime generation of text, images, or audio;
- real-person messaging, public profiles, UGC, social feeds, or multiplayer;
- therapeutic or medical claims;
- mandatory accounts;
- cloud sync UI, payments, entitlements, paywalls, energy, or premium answers;
- real-time waits that block authored progress;
- cross-character shared narrative state;
- advertising personalization based on story content.

Protocol and service seams for sync, packages, reports, and future operations may
exist without implying that the corresponding consumer capability is launched.
Never expose a placeholder control that promises an unavailable feature.

## 4. Product truth and documentation precedence

Use this order when two repository documents disagree:

1. The latest explicit user/product-owner instruction.
2. A dated superseding entry in `DECISIONS.md`.
3. Accepted architecture decisions in `docs/architecture/ADR-*.md`.
4. The implemented capability contract in
   `docs/product/CAPABILITY_IMPLEMENTATION.md`.
5. The baseline requirements in
   `docs/product/PRODUCT_DESIGN_SPEC.md`.
6. README and supporting runbooks.

`PRODUCT_DESIGN_SPEC.md` is intentionally broad and includes future GA
capabilities. Do not interpret every future section as authorization to ship it
now. `DECISIONS.md` converts open questions into repository defaults and records
dated supersessions. When product direction changes, update the decision
register in the same change so code and documentation do not drift.

Useful documents:

- `README.md` — workspace overview, requirements, commands, and release posture.
- `DECISIONS.md` — accepted defaults and superseding product decisions.
- `SECURITY.md` — vulnerability reporting and security invariants.
- `docs/product/PRODUCT_DESIGN_SPEC.md` — complete product and acceptance model.
- `docs/product/CAPABILITY_IMPLEMENTATION.md` — implemented capability boundary.
- `docs/product/PDS_REQUIREMENT_AUDIT.md` — requirement disposition.
- `docs/product/RELEASE_EVIDENCE.md` — automated and manual release evidence.
- `docs/architecture/ADR-001-runtime-and-monorepo.md` — runtime and monorepo.
- `docs/architecture/ADR-002-dialogue-and-persistence.md` — deterministic turns.
- `docs/architecture/ADR-003-content-packages.md` — package compilation/signing.
- `docs/architecture/ADR-004-network-boundaries.md` — local-first networking.
- `docs/content-style/RUSSIAN_HOUSE_STYLE.md` — Russian editorial rules.
- `docs/operations/CONTENT_RELEASE_RUNBOOK.md` — signing, rollout, rollback.
- `docs/operations/INCIDENT_AND_RECOVERY_RUNBOOK.md` — incident response.
- `docs/security/THREAT_MODEL.md` — trust boundaries and controls.
- `docs/quality/PLATFORM_SUPPORT_MATRIX.md` — native support and evidence.
- `docs/quality/ACCESSIBILITY_DEVICE_MATRIX.md` — accessibility release gates.

## 5. Non-negotiable invariants

Treat these as system contracts, not styling preferences:

- Every published reachable nonterminal decision resolves exactly four visible,
  enabled choices.
- Every choice references a real reaction and a real next state or terminal
  outcome.
- The engine is deterministic and pure. It imports no React, database, network,
  platform, or model runtime.
- The UI never evaluates story conditions or applies narrative effects.
- Content cannot execute code, raw SQL, `eval`, or arbitrary operators.
- The selected wording, event, resulting state, and frozen transcript are
  durably committed before the UI reveals the outgoing reply and reaction.
- Retrying an operation must not duplicate its effect. Operation ID, expected
  node, exact build ID, and sequence participate in idempotency/conflict checks.
- Published builds are immutable. A correction creates a new build ID.
- A content package is schema-checked, checksummed, signature-verified, and only
  then activated atomically.
- Existing runs remain pinned to their exact content build for replay.
- Transcript text is frozen after display; later grammar or content updates do
  not rewrite history.
- Installed gameplay remains available when catalog, reports, or sync services
  are unavailable.
- Raw dialogue, display name, grammatical profile, and complete trajectory are
  never product-analytics fields.
- No locked, disabled, paywalled, or deceptive option may occupy one of the four
  active reply slots.
- Russian UI and content remain usable without analytics consent, account,
  notification permission, or network connectivity.

Any change that weakens one of these invariants needs a dated product decision,
an ADR when architectural, migrations where durable data changes, and explicit
regression coverage.

## 6. Monorepo map

CharTalk is an npm-workspaces TypeScript monorepo.

### Applications

- `apps/mobile` — Expo SDK 57 / React Native reader for iOS and Android, plus a
  browser QA/export target.
- `apps/content-studio` — Vite/React editorial workbench for schema-aware editing,
  review, simulation, validation, diffing, and immutable publication.

### Service

- `services/api` — Hono/Node catalog, content manifest/package delivery, content
  reports, diagnostics, restricted publication, and optional sync boundary.
- `services/api/openapi.yaml` — HTTP contract. Update it with route or DTO changes.

### Shared packages

- `packages/content-schema` — Zod contracts for story graphs, conditions, effects,
  packages, manifests, state, and related DTOs.
- `packages/dialogue-engine` — pure deterministic choice resolution, state effects,
  replay, and canonical hashing.
- `packages/app-core` — app-facing durable domain repository, profiles, settings,
  runs, branches, reports, mutations, and snapshot upgrades.
- `packages/content-compiler` — graph/reference checks, reachability,
  counterfactual outcome analysis, payoff checks, Russian rules, capacity reports,
  and signing/build preparation.
- `packages/content-integrity` — canonical bytes, SHA-256/Ed25519 verification,
  trusted templates, and Russian quality utilities shared across install
  boundaries.
- `packages/sync-protocol` — schemas for optional event sync and conflict handling;
  presence of this package does not mean sync is enabled in the reader.
- `packages/analytics-schema` — strict metadata-only event contracts.
- `packages/design-system` — semantic colors, type, spacing, radius, target-size,
  motion, and theme tokens shared by native and web surfaces.
- `packages/test-fixtures` — deterministic authored sample, bulk scale fixture,
  signed/tampered packages, and durable run fixtures.

### Tooling and tests

- `tooling` — build/export scripts, content validation, signing, shard partitioning,
  capacity reports, secret scan, container checks, and native smoke harnesses.
- `tests/e2e` — Playwright reader and Studio behavior.
- `.github/workflows/ci.yml` — verify, container, E2E, Android, and iOS jobs.
- `artifacts` — generated evidence; do not hand-edit it or treat it as source.
- `output` — generated distribution material; do not use it as implementation
  truth.
- `patches` — reviewed `patch-package` fixes for upstream dependencies.

## 7. Architectural layers and dependency direction

The intended flow is:

```text
UI / routes / Studio / API handlers
        ↓
application coordination and repositories
        ↓
pure domain packages and schemas
        ↓
platform persistence, HTTP, filesystem, and native adapters
```

Important package boundaries:

- `apps/mobile` depends on `app-core`, schemas, engine, integrity, sync contracts,
  analytics contracts, design tokens, and fixtures.
- `app-core` depends on `content-schema`, `dialogue-engine`, and `sync-protocol`.
- `content-compiler` depends on schema, engine, and integrity.
- `content-studio` depends on compiler/schema/engine/integrity, never on mobile UI.
- `services/api` consumes shared schemas and engine/compiler contracts; it must not
  duplicate canonical narrative logic.
- `dialogue-engine` and `content-schema` must stay platform-neutral and side-effect
  free.

Do not solve a domain problem inside a route component because it is convenient.
Move reusable rules into the lowest platform-neutral package that owns them.
Do not make the engine aware of React, SQLite, Expo, Hono, filesystem paths, or
environment variables.

## 8. Runtime and technical stack

Repository baseline:

- Node.js 22.13 or newer; CI currently uses Node 24.
- npm 11 and one root `package-lock.json`.
- TypeScript ESM with bundler module resolution.
- React 19.2.3.
- Expo SDK 57.
- React Native 0.86.2 with Hermes and the mandatory New Architecture.
- Expo Router for file-based mobile navigation.
- Expo SQLite for native durable data; a behaviorally equivalent local web
  adapter supports browser QA.
- Vite 8 for Content Studio.
- Hono 4 and Zod 4 for the API.
- Vitest 4 with V8 coverage.
- Playwright for browser E2E.
- Stryker mutation testing for the dialogue core.
- CocoaPods/Xcode for iOS and Gradle/JDK 17 for Android.

Strict TypeScript settings include `strict`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `noImplicitOverride`, and isolated modules. Do not
silence these contracts with `any`, broad casts, or unchecked indexing.

## 9. Mobile application architecture

### Routes

`apps/mobile/app` is the Expo Router tree. Key routes include:

- `index.tsx` — boot routing and onboarding/reader entry.
- `onboarding.tsx` and `onboarding/*` — first-use explanation and preferences.
- `(tabs)/stories.tsx` — embedded catalog home.
- `(tabs)/archive.tsx` — durable progress and completed/archived runs.
- `(tabs)/settings.tsx` — reading, notification, privacy, and device settings.
- `story/[storyId].tsx` and `character/[characterId].tsx` — detail surfaces.
- `run/[runId].tsx` and `story/[storyId]/run/[runId].tsx` — reader surfaces.
- recap and branches routes — replayable history and checkpoint branches.
- appearance, text size, content controls, downloads, account, support, report,
  and legal routes — supporting settings and operations.

Keep route files focused on presentation, navigation, and orchestration. Domain
calculations belong in `src/domain`, `app-core`, the dialogue engine, or content
packages.

### Global state and repositories

`apps/mobile/src/state/AppProvider.tsx` is the application composition boundary.
It owns the active repository, snapshot hydration, catalog/package state,
settings mutations, runs, reports, sync outbox behavior, and recovery concerns.
Consume it through `useApp`; do not introduce a second competing source of
durable truth.

`packages/app-core` defines the durable `AppSnapshot` and repository behavior.
When adding persisted data:

1. Add a typed field and safe default.
2. Increment `schemaVersion` when the snapshot contract changes.
3. Update `emptySnapshot`/defaults.
4. Extend `upgradeSnapshot` so older partial snapshots migrate safely.
5. Add migration tests using a genuinely older shape.
6. Update export/privacy fixtures when the field is user-visible or exported.

### Platform adapters

Native and browser behavior is separated with platform files, including:

- `persistence/repository.native.ts` and `.web.ts`;
- `persistence/media-store.native.ts` and `.web.ts`;
- notification gateway native/web files.

Metro selects `.native.ts` for native builds; TypeScript/browser resolution may
use the base or `.web.ts` adapter. Keep public function signatures aligned and
never import a native-only Expo module from a shared platform-neutral file.

### Persistence

Native state uses SQLite with foreign keys, WAL, atomic migrations, event/snapshot
storage, package registries, outboxes, and stable transcript entry IDs. Browser QA
uses local persistence with equivalent observable behavior.

Preserve these properties:

- choice commit and narrative effects are atomic;
- retries are idempotent;
- migrations are replayable and fail without corrupting the original state;
- resume anchors use stable entry IDs, not only array indexes;
- transcript rendering uses a bounded window for very long runs;
- partial package/download state never becomes active content;
- deleting local data is explicit and distinct from account/cloud deletion.

### Content loading

The catalog begins from compact bundled metadata. Story-owned local shards are
loaded on demand, and web export warms Cache Storage. Opening an embedded story
must not call the content API or require a manual download. Cache-first remote
catalog revalidation may discover signed updates, but the last known catalog and
active exact build remain usable offline.

### UI and themes

Use semantic tokens from `@chartalk/design-system` and the theme provider. Do not
scatter raw brand colors, inconsistent target sizes, or private type scales.
Interactive controls must preserve at least the shared 48 logical-pixel target.

The supported theme model includes system/light/dark and the additional warm and
mono experiences implemented by the design system. Text size is persisted at
100/150/200 percent. Reduced motion must make message reveal and relevant
transitions effectively instant.

Use existing primitives and `SettingsRow` before inventing parallel components.
All state must have a non-color signal such as text, icon, check mark, radio
state, or accessibility state.

## 10. Reader turn model

The conceptual turn state machine is:

```text
restoring
  → showing incoming
  → waiting for choice
  → provisional choice
  → committing
  → showing outgoing reply and reaction
  → next decision | checkpoint | ending
```

The three-second provisional window is durable by product decision. The reader
may replace or immediately send the provisional selection, but once committed it
must not be silently changed. Interruption at every boundary must return to a
coherent state after relaunch.

The dialogue engine returns an immutable turn plan. Repositories, not UI code,
apply the plan transactionally. The outgoing bubble and reaction become visible
only after commit succeeds. Never create an optimistic transcript that can imply
a choice was saved when it was not.

## 11. Narrative and content model

Stories are directed graphs, not copied trees. Re-convergence is allowed only
when earlier memories remain available and downstream callbacks preserve the
meaning of prior choices.

The content DSL is declarative and allowlisted:

- conditions read typed durable narrative state;
- effects update bounded typed fields;
- history predicates read committed events;
- choice candidates resolve into exactly four active slots;
- transitions are deterministic and priority-controlled;
- endings have authored eligibility and epilogues.

Content stable IDs survive editorial movement. Published text is immutable for a
build. A new wording, link, condition, effect, media digest, or migration produces
a new artifact/build rather than mutating a released package.

Compiler validation is release-blocking for at least:

- exactly four resolved choices;
- dangling or missing references;
- unreachable non-deprecated nodes;
- nonterminal dead ends and unbounded loops;
- pairwise-distinct immediate reactions;
- pairwise-distinct next choice signatures or terminal outcomes;
- choice-specific state writes with reachable downstream payoff;
- placeholder and grammatical-profile validity;
- Russian normalization, accidental duplicates, and house-style rules;
- content warning and safe-route requirements;
- media MIME, byte, dimension, path, and digest constraints;
- capacity and package budget constraints.

The generated 240-story bulk fixture validates scale and deterministic behavior.
It is not editorial proof. Never describe fixture counts as approved GA inventory.

## 12. Russian language and editorial quality

UI copy and stories are Russian-first. Follow
`docs/content-style/RUSSIAN_HOUSE_STYLE.md` and the character voice bibles.

General rules:

- Write natural contemporary Russian directly.
- Use `ё` explicitly unless a documented character voice intentionally differs.
- Avoid slash forms such as `сделал/сделала`; use grammar-aware variants or
  neutral phrasing.
- System UI uses neutral imperatives and does not assume a gendered form of
  address.
- The display name and grammatical profile may affect future rendered text, but
  must never rewrite frozen transcript entries.
- Preserve each character's `ты/вы`, punctuation, vocabulary, tempo, boundaries,
  and relationship register.
- Avoid pseudo-profound monologues, forced slang, generic romance escalation,
  translated idioms, fake emergencies, and guilt-based retention copy.

Automated Russian lint is necessary but not sufficient. Human native-editor,
continuity, safety, and rights evidence remain release gates.

## 13. Local notifications

Notifications are currently generic, app-branded, local-only reading reminders.
The 2026-08-23 superseding decision in `DECISIONS.md` replaces the older exclusion.

Current behavior:

- The final onboarding CTA completes onboarding, then requests notification
  permission. The early “start immediately” skip path completes onboarding
  without requesting permission.
- Notification failure never blocks onboarding or reading.
- Settings always exposes a master notification switch.
- When permission can be requested, the switch invokes the system request only
  after explicit user action.
- When the OS will not show another prompt, the switch opens application settings.
- When permission is granted and reminders are enabled, Settings exposes types,
  frequency, weekend day, and delivery time.
- Types are new-story discovery and unfinished-story continuation.
- Frequencies are weekly, every two weeks, or every four weeks.
- Delivery day is Saturday or Sunday; time is 10:00, 14:00, or 18:00 local time.
- Default is weekly, Saturday, 10:00, with both categories enabled.
- Reminders begin only after the selected inactivity period. Reading activity
  moves the plan forward.
- The scheduler maintains a rolling one-year horizon: 52 weekly, 26 fortnightly,
  or 13 four-week reminders. This remains below iOS's pending-local-notification
  ceiling.
- If both categories apply, reminder copy alternates. An unfinished reminder is
  only planned when an active run exists.
- Scheduled requests are tagged. Reconciliation cancels only CharTalk reading
  reminders, never unrelated notifications.
- A reminder tap navigates to the stories tab.
- The coordinator reconciles after durable snapshot changes and when the app
  returns to the foreground.
- No push token, remote notification service, user trajectory upload, or account
  is required.
- Web reports notification permission as unavailable and schedules nothing.

Copy must remain generic and non-coercive. Do not impersonate a character, imply
that a real person is waiting or suffering, reveal spoilers, fake urgency, or use
romantic guilt. Keep reminder categories and cadence under explicit user control.

Android-specific rule: create the notification channel before requesting Android
13+ permission. For the platform default sound, omit a custom channel filename
and use `sound: true` on scheduled content. The string `"default"` is treated as
a missing custom resource by the installed Expo Notifications version and causes
a runtime warning.

## 14. Content packages, integrity, and release lifecycle

Authoring produces normalized JSON. The compiler resolves references and emits a
deterministic package plus build report. Production artifacts are immutable,
checksummed, and signed with Ed25519.

Installation follows this shape:

```text
download candidate
  → validate envelope/schema
  → verify trusted signing key ID and Ed25519 signature
  → verify canonical checksum and every asset digest
  → verify engine/schema compatibility
  → write candidate records/media
  → atomically move active pointer
  → retain last-known-good/exact builds needed by runs
```

Never activate partial, corrupt, unsigned, unknown-key, incompatible, or
revoked content. Never delete the only package required to replay an existing
run.

Large catalogs may be partitioned into independently downloadable story-owned
shards. Production shard output must be signed and pass the same release gate.
`CHARTALK_ALLOW_UNSIGNED_SHARDS=true` is for local inspection only.

Content release requires exact immutable `buildId` confirmation, two-person
approval, isolated signing, separate verification, staged rollout, and rollback
readiness. Follow `docs/operations/CONTENT_RELEASE_RUNBOOK.md`; do not invent a
shortcut in application code or CI.

## 15. API and network boundaries

The API is a Hono/Node service with strict Zod validation and durable SQLite
storage. Public responsibilities include health/readiness, catalog metadata,
characters, manifests, immutable packages/assets, and content reports. Restricted
routes validate/publish content. Optional sync routes are guarded by configuration.

Representative routes are defined in `services/api/openapi.yaml`, including:

- `GET /healthz`, `/ready`, `/readyz`, `/v1/health`, `/v1/ready`;
- `GET /v1/catalog`;
- `GET /v1/catalog/characters/:characterId`;
- `GET /v1/content/manifests/:packId`;
- `GET /v1/content/packages/:packId`;
- exact build and asset routes;
- `POST /v1/reports`;
- restricted `/v1/admin/content/validate` and `/publish` boundaries.

Network rules:

- Core gameplay never depends on an API round trip.
- Catalog metadata is cacheable and revalidated with ETag.
- A newly discovered story cannot start until its matching exact signed build is
  locally available and verified.
- Mobile report, diagnostics, package, and sync endpoints require HTTPS except
  exact loopback hosts used for development.
- CORS is a browser boundary, not native authentication.
- A production ingress terminates TLS, overwrites forwarded client-IP headers,
  caps request bodies, rate-limits, and isolates admin routes.
- Ordinary serving replicas have no signing private key and publishing disabled.
- Logs contain request IDs and error classes, not bodies, transcripts, secrets,
  names, or private keys.

When changing an API DTO or route, update schemas, OpenAPI, service tests, mobile
client tests, and runtime smoke evidence together.

## 16. Content Studio

Content Studio is intentionally narrow. It is not a general document platform.
It owns schema-aware editing, status workflow, simulation, grammar previews,
counterfactual review, content diffing, validation, and immutable publication.

The broad editorial workflow is:

```text
outline
  → graph-ready
  → draft
  → voice review
  → continuity review
  → rating/safety review
  → logic QA
  → device QA
  → approved
  → scheduled
  → published
  → deprecated
```

Publication requires the appropriate role, an exact build confirmation, all
release gates, a mounted signing key on an isolated publisher, and immutable
output. Do not collapse writer/editor/QA/publisher responsibility into an
unguarded “admin” button.

## 17. Security and privacy model

Principal trust boundaries are the untrusted mobile client, immutable signed
content, public API, and restricted editorial/publishing environment. Assume a
reader binary can be modified. Never trust client-computed effects, ending,
content version, entitlement, or state hash as server authority.

Protected assets include progress, reports, consent timestamps, optional
diagnostic metadata, unpublished authored content, signing keys, package
integrity, exact-build replay, and editorial evidence.

Required controls:

- strict schemas and allowlisted operators;
- canonical hashing and Ed25519 signatures;
- atomic activation and retained rollback builds;
- constant-time high-entropy admin token comparison;
- separate public and administrative rate buckets;
- file-mounted private keys, never values embedded in environment variables or
  logs;
- explicit origin allowlist and identity-aware publishing ingress;
- OS sandbox/encryption and secure token storage;
- metadata-only analytics, reports, diagnostics, and support bundles;
- secret scanning that reports location/rule but never echoes secret values.

Never commit real credentials. Never place secrets in `EXPO_PUBLIC_*`; those
values are embedded in the application. Never run `npm audit fix --force`
without dependency compatibility and threat-model review. Time-bounded accepted
transitive findings are documented in
`docs/security/DEPENDENCY_EXCEPTIONS.md`.

If you encounter suspected exposure, do not paste credentials, reports, or
transcripts into output. Follow `SECURITY.md` and the incident runbook.

## 18. Accessibility contract

Automated accessibility assertions are required, but they do not replace manual
VoiceOver/TalkBack evidence for a release candidate.

Preserve these requirements:

- all four choices remain visible/ordered/selectable at 200 percent text;
- reading and focus order match narrative order;
- every interactive control has a meaningful role, label, state, and target;
- radio, switch, selected, disabled, and expanded state are exposed explicitly;
- no required information is color-, sound-, haptic-, or motion-only;
- reduced motion and instant reveal work throughout the reader;
- warning and safe-route flows are navigable without timed pressure;
- branch views do not expose spoilers through accessibility labels;
- Russian text does not clip at supported phone sizes;
- focus moves predictably after navigation, commit, errors, and dialogs.

Browser emulation is not proof of TalkBack or VoiceOver. Add manual device,
OS/build, tester, date, and screen-reader evidence to the release matrix.

## 19. Performance and scale budgets

The data model and tooling are designed for at least:

- 1,000,000 published text units in the catalog;
- 200,000 decision nodes;
- 100 characters and 2,000 episodes;
- 20,000 locally installed decision nodes without material degradation;
- a 10,000-entry transcript stress run;
- 100 active local runs;
- a character package up to 250 MiB with media and 50 MiB without media.

The current 243-story bundle is a release-shape choice, not the upper bound of
the architecture. Preserve on-demand shard parsing, bounded transcript windows,
stable anchors, compact metadata, and deterministic compiler/load tests.

Avoid unbounded scans in render paths, loading every story graph at app boot,
copying whole snapshots for tiny UI derivations, and network work on each choice.
Measure before adding caches that create a second source of truth.

## 20. Environment configuration

Copy `.env.example` for local service/mobile configuration. Public and secret
settings have different trust properties.

### API and publisher

- `CHARTALK_API_HOST`, `PORT` — bind address and port.
- `CHARTALK_API_DB_PATH` — writable service SQLite path.
- `CHARTALK_ALLOWED_ORIGINS` — explicit browser origins.
- `CHARTALK_CONTENT_PACKAGE_PATH` — mounted release package.
- `CHARTALK_CONTENT_ASSET_ROOT` — immutable media root.
- `CHARTALK_SIGNING_PUBLIC_KEY_FILE` — serving verification key.
- `CHARTALK_SIGNING_KEY_ID` — immutable key identity.
- `CHARTALK_ADMIN_TOKEN` — high-entropy bearer secret.
- `CHARTALK_PUBLISH_ENABLED` — false on ordinary serving replicas.
- `CHARTALK_SIGNING_PRIVATE_KEY_FILE` — isolated publisher-only read-only mount.
- `CHARTALK_CMS_WRITER_TOKEN`, `CHARTALK_CMS_EDITOR_TOKEN`,
  `CHARTALK_CMS_QA_TOKEN`, `CHARTALK_CMS_PUBLISHER_TOKEN` — separated editorial
  roles where configured.
- `CHARTALK_SYNC_ENABLED`, `CHARTALK_SYNC_TOKEN`,
  `CHARTALK_SYNC_ACCOUNT_ID` — optional sync boundary, disabled by default.

### Mobile public configuration

- `EXPO_PUBLIC_CHARTALK_API_URL` — public service URL.
- `EXPO_PUBLIC_CHARTALK_CONTENT_PUBLIC_KEYS` — JSON key-ID to base64url Ed25519
  public-key map used for rotation overlap.
- `EXPO_PUBLIC_CHARTALK_CONTENT_PUBLIC_KEY` — legacy development fallback only.

### Android signing

- `CHARTALK_ANDROID_KEYSTORE_FILE`;
- `CHARTALK_ANDROID_KEYSTORE_PASSWORD`;
- `CHARTALK_ANDROID_KEY_ALIAS`;
- `CHARTALK_ANDROID_KEY_PASSWORD`.

Release signing fails closed without these. `CHARTALK_ALLOW_DEBUG_SIGNING=true`
is only for explicit local standalone smoke builds, never store submission.

### Tooling-only controls

Capacity, shard, report, and smoke tools accept `CHARTALK_CAPACITY_*`,
`CHARTALK_MAX_STORIES_PER_SHARD`, `CHARTALK_ALLOW_UNSIGNED_SHARDS`,
`CHARTALK_RELEASE_PACKAGE`, and related variables. Treat bypass flags as local
fixture controls, not production configuration.

## 21. Local setup and common commands

Run commands from the repository root unless a command explicitly names another
working directory.

Install:

```bash
npm install
```

Development surfaces:

```bash
npm run dev:mobile
npm run dev:studio
npm run dev:api
```

Native launch:

```bash
npm run android
npm run ios
```

Fast verification:

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
```

Focused Vitest:

```bash
npm test -- path/to/file.test.ts
```

Coverage and mutation:

```bash
npm run test:coverage
npm run test:mutation
```

Browser E2E:

```bash
npm run test:e2e
```

Builds and contracts:

```bash
npm run build
npm run test:container:contract
npm run test:api:smoke
npm run test:ios:project
npm run test:android:smoke
```

Content gates:

```bash
npm run validate:content
npm run validate:release
npm run test:content:bulk
npm run test:content:scale
npm run test:russian-quality
npm run test:capacity
```

Full repository gate:

```bash
npm run verify
```

`npm run verify` includes formatting, lint, strict types, secret scan, container
contract, iOS project metadata, coverage, dialogue mutation testing, content
validation, bulk/Russian/capacity checks, builds, and API runtime smoke. It is
deliberately expensive; use focused checks while iterating, then the proportional
full gate before handoff or release.

## 22. Testing workflow

Use test-driven changes for features, regressions, migrations, and refactors:

1. Identify the smallest behavioral contract that should fail.
2. Add or update a test and run it to confirm the intended red failure.
3. Implement the smallest correct change.
4. Run the focused test to green.
5. Refactor without changing behavior.
6. Run affected type, lint, format, and contract checks.
7. Run the full suite in proportion to risk.

Do not weaken, delete, or broadly mock a failing test just to turn CI green.
Contract/source tests may guard integration wiring, but domain behavior should be
tested through real functions and state transitions whenever practical.

Coverage thresholds in `vitest.config.ts` are:

- global branches/functions/lines/statements: at least 80 percent;
- `app-core`: at least 80 percent branches and lines;
- `dialogue-engine`: at least 95 percent branches and statements.

UI snapshots alone are not behavioral coverage. High-value tests include:

- engine truth tables, property tests, replay, hashing, and idempotency;
- repository atomicity and migration fixtures;
- four-choice and counterfactual compiler validation;
- signed/tampered package installation;
- cache/offline and exact-build behavior;
- report/analytics privacy rejection tests;
- content and Russian quality gates;
- accessible E2E flows at Pixel 7 and iPhone SE widths;
- native standalone kill/resume and four-choice semantics.

## 23. Code conventions

- Prefer clear, immutable TypeScript and small pure functions.
- Use `import type` for type-only imports.
- Never introduce `any`; model unknown input and validate it.
- Handle promises explicitly. Use `void` only for intentionally detached UI work
  whose failures are contained.
- Do not use non-null assertions unless an invariant is already proven locally.
- Account for `noUncheckedIndexedAccess` when indexing arrays and maps.
- Use exhaustive unions for state machines and persisted preferences.
- Keep side effects at application/platform boundaries.
- Keep route components declarative; move calculations and state transitions out.
- Reuse semantic design tokens, primitives, and existing settings/card patterns.
- Keep user-facing Russian copy concise, natural, and consistent with the house
  style.
- Preserve web/native parity or add an explicit platform adapter/stub.
- Do not edit generated build output, Pods, coverage, exported web assets, or
  fixture reports manually.
- Do not mutate published content fixtures in place when a versioned artifact is
  the correct model.
- Avoid unrelated formatting or dependency churn.
- Preserve unrelated user changes in a dirty worktree.

Formatting uses Prettier. Linting uses ESLint recommended and typed TypeScript
rules, including consistent type imports, no floating promises, and no explicit
`any`.

## 24. Discovery and codebase knowledge graph

This repository maintains a codebase knowledge graph. Prefer it over textual
search for code discovery:

1. `search_graph` — functions, classes, routes, variables, and natural-language
   concept search.
2. `trace_path` — callers, callees, data flow, and cross-service impact.
3. `get_code_snippet` — source for an exact symbol found by graph search.
4. `query_graph` — multi-hop or aggregate Cypher analysis.
5. `get_architecture` — packages, layers, routes, boundaries, and hotspots.

Use `search_code` or `rg` for string literals, error messages, environment keys,
Markdown, JSON/config, and cases the graph does not model. If the graph is absent
or stale, run `index_repository` before broad code discovery.

For edits, use narrow patches. Inspect the target and its tests before changing
it. Trace inbound/outbound impact when touching repositories, engine behavior,
schema types, persistence, or API contracts.

## 25. Native project rules

The mobile app uses Expo CNG but materializes native projects for release and
smoke evidence.

### General

- A native dependency requires the Expo config plugin when applicable, lockfile
  changes, native install, and both platform checks.
- Run `npx expo config --type public` or the relevant config check after changing
  `app.json`.
- Do not commit `apps/mobile/ios/Pods`, iOS/Android `build`, `.expo`, or derived
  data.
- Do commit intentional `Podfile.lock`, project resource references, Gradle
  configuration, and app config changes.
- Native-library upgrades require compatibility review against Expo SDK, Hermes,
  New Architecture, minimum OS versions, and physical-device evidence.

### Android

- Supported floor is Android 10 / API 29; CI compiles against the current project
  SDK and tests a standalone emulator artifact.
- Use JDK 17 for Gradle.
- Production release signing must fail closed without the four keystore settings.
- The smoke APK debug-signing escape hatch is local/CI evidence only.
- Verify manifest permissions, channels/services, and API-specific permission
  behavior when adding native capabilities.

### iOS

- Supported floor is iOS 17.
- Run `pod install` after native dependencies change and preserve the lockfile.
- `npm run test:ios:project` is host-independent metadata smoke;
  `test:ios:project:strict` requires Xcode discovery.
- `npm run test:ios:build` produces an unsigned Release Simulator artifact.
- Store/device signing, minimum-device performance, and VoiceOver remain manual
  release-owner evidence.

## 26. Git and generated-file hygiene

Before editing:

- inspect `git status --short`;
- assume existing modifications belong to the user;
- avoid touching unrelated files;
- determine whether a generated file has a canonical source.

After editing:

- run Prettier only on changed source/docs unless a repository-wide format was
  requested;
- run `git diff --check`;
- inspect `git diff --stat` and the actual diff;
- confirm no secret, build output, emulator capture, database, Pods directory, or
  private artifact was added;
- report tests and any remaining manual gates accurately.

Do not use destructive reset/checkout commands to clean a dirty tree. Do not
overwrite user work to simplify a patch.

## 27. Definition of done by change type

### UI change

- Behavior matches the current product decision.
- Loading, empty, error, offline, and large-text states remain coherent.
- Roles, labels, state, focus, target size, reduced motion, and non-color signals
  are correct.
- Both native and web/typecheck paths compile when the component is shared.
- Contract/E2E tests cover discoverability and the key interaction.

### Domain or engine change

- Determinism and purity are preserved.
- Same input produces same plan/hash.
- Exactly-four and idempotency contracts remain green.
- Unit/property tests and mutation-sensitive assertions cover the new branch.
- No platform dependency enters a pure package.

### Persisted-data change

- Schema version/default/upgrade is complete.
- Old and new snapshots migrate in tests.
- Failure leaves original state coherent.
- Export/delete/privacy implications are handled.
- Native and web adapters preserve behavior.

### Content-schema/compiler change

- Runtime and compiler agree on the DSL.
- Zod types, reference checks, counterfactual validation, fixtures, reports, and
  compatibility rules are updated.
- Existing signed/replay fixtures still behave intentionally.
- Build IDs and immutable artifacts are not rewritten.

### API change

- Handler, Zod schema, OpenAPI, clients, error envelope, rate/body boundaries,
  and contract tests change together.
- Offline gameplay degradation remains safe.
- Logs and analytics remain metadata-only.
- Container and API runtime smoke pass.

### Native dependency or capability

- Package and lockfiles are aligned with Expo.
- Config plugin and generated native resource references are correct.
- Android compile/install and iOS pods/project smoke pass.
- Permission timing is user-initiated and platform behavior is verified.
- Web has an explicit safe fallback.

### Product decision

- `DECISIONS.md` records the date, superseded decision, behavior, and consequence.
- Relevant PDS audit/capability/release evidence is updated.
- Code, tests, copy, and this handbook do not retain contradictory instructions.

## 28. Release and operational gates

Code-complete does not mean General Availability. Public release still requires
human editorial inventory, native-language approval, rights/provenance,
accessibility device evidence, legal/store decisions, production key custody,
incident ownership, infrastructure review, and the content scale gate described
in the PDS.

For a content release:

1. Freeze source revision and build ID.
2. Gather editorial, continuity, safety, accessibility, and rights evidence.
3. Run `npm run validate:release` and all required traversals/tamper/device checks.
4. Require two named approvers.
5. Sign on an isolated publisher with a read-only file-mounted key.
6. Verify manifest, key ID, checksum, media, and serving replica independently.
7. Promote 1 → 10 → 50 → 100 percent while monitoring.
8. Stop and revoke on any signature/checksum failure, broken node, unsafe route,
   silent progress loss, major crash regression, or readiness failure.
9. Roll back the active pointer to a compatible last-known-good build without
   deleting exact builds required by runs.

For incidents, preserve metadata evidence without copying bodies or secrets,
assign incident roles, apply the smallest reversible containment, verify restore
integrity, and record owner/timeline/corrective actions.

## 29. Practical handoff checklist

Before saying a task is complete, answer all applicable questions:

- Did the change preserve authored, deterministic, exactly-four gameplay?
- Is offline reading still the default experience?
- Did I avoid creating a second source of durable truth?
- Are schema defaults and migrations complete?
- Are native and web adapters aligned?
- Is Russian copy natural and non-coercive?
- Are accessibility semantics and 200-percent text accounted for?
- Did I add a failing regression test before the fix where practical?
- Did focused tests, typecheck, lint, formatting, and the proportional full suite
  pass?
- Did content/API/native changes receive their specialized gates?
- Did I inspect the final diff and preserve unrelated work?
- Did I update a dated decision or architecture record if the product contract
  changed?
- Did I distinguish automated evidence from pending human/device/release evidence?

If any answer is no, either finish the missing work or state the remaining gate
explicitly. Never imply that synthetic fixtures, browser emulation, debug signing,
or a simulator build are equivalent to human-approved production evidence.
