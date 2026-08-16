# Capability implementation contract

## CAPABILITY

A Russian-speaking reader can start without an account, understand that CharTalk is authored fiction, choose a character, open any bundled episode without an additional download, and make one of exactly four meaningful replies at every decision. The selected wording and choice-specific consequence are saved before the story advances. Bundled content, portraits, and limited authored image attachments remain playable offline, and the reader can resume, review a recap, branch from a checkpoint, control sensitive themes, and report a content problem. Signed content updates are optional and never block the bundled catalog.

## CONSTRAINTS

- The dialogue engine is deterministic, pure TypeScript, and has no React, database, network, or model dependency.
- Every reachable nonterminal decision resolves exactly four visible enabled choices.
- Each choice has a distinct visible immediate reaction, distinct next-decision signature or terminal outcome, and a choice-specific state write read by later content or an ending.
- The authored DSL is declarative and schema-gated: history predicates read only durable state, while memory, promise, arc-phase, and cooldown effects are applied atomically and included in compiler payoff analysis.
- An operation ID, expected node, build ID, and sequence make choice commits idempotent and conflict-aware.
- Content packages are immutable, checksummed, signed, versioned, and activated only after validation.
- Published story text is Russian source text. Generated fixtures never count as approved launch inventory.
- Guest play, the bundled sample, settings, safety routes, accessibility, and export remain usable without analytics consent or a network.
- The catalog starts from compact local metadata; native story-owned shards are parsed on demand, while the exported web shell warms its own Cache Storage. Opening a story never calls the content API or requires a user-triggered download.
- Raw dialogue, display name, grammatical profile, and full trajectory are excluded from product analytics.

## IMPLEMENTATION CONTRACT

Actors:

- guest reader;
- accessibility-feature reader;
- writer, native-language editor, continuity reviewer, QA, publisher;
- support operator with metadata-only access;
- security/operations owner.

Surfaces:

- Expo mobile reader;
- browser-based content studio and simulator;
- catalog/package/report API;
- offline compiler and release evidence reports.

States and transitions:

- onboarding → stories → character → run;
- restoring → showing incoming → waiting choice → provisional choice → committing → reaction → next decision/checkpoint/ending;
- downloaded package: absent → downloading → verifying → installed → active → rollback candidate;
- content: outline → graph-ready → draft → voice review → continuity review → rating review → logic QA → device QA → approved → scheduled → published → deprecated (with a legacy QA import alias).

Data implications:

- local app data is append-only events plus snapshots, frozen transcript, package registry, settings, branches, reports, and outbox;
- content is read-only after publication;
- server verification replays IDs against the exact signed build and never trusts client-computed effects.

## NON-GOALS

- Free-text chat, runtime AI, real-person messaging, social/UGC/multiplayer, therapy claims, energy mechanics, premium choices, or mandatory accounts.
- Payments and cloud sync in this release; the protocol seams exist for a separately approved rollout.
- Treating generated fixture copy or art as human-approved launch inventory.

## OPEN RELEASE EVIDENCE

- Human editorial inventory and the 300,000 unique Russian text-unit gate.
- Moderated reader research for agency, authored-fiction comprehension, and naturalness.
- Legal/store approvals for territories and rating.
- Manual VoiceOver/TalkBack, device performance, signing-key, incident-response, and production infrastructure evidence.

## HANDOFF

Implementation is accepted only when automated verification is green and every applicable item in `RELEASE_EVIDENCE.md` links to signed evidence. A code-complete build may be distributed internally while human/legal/scale gates remain explicitly red; it must not be labeled GA.
