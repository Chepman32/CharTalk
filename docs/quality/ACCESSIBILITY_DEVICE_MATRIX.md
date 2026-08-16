# Accessibility and device evidence matrix

Automated semantics and browser tests are necessary but do not replace manual release evidence. Complete every applicable row on a signed release candidate.

## Automated implementation evidence — 2026-08-14

| Check                    | Result                                                                                                                                                                                | Evidence                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Responsive phone widths  | Passed at iPhone SE 320×568 and Pixel 7 emulation; explicit document/body overflow assertions                                                                                         | `tests/e2e/mobile.spec.ts`                                                   |
| Core keyboard semantics  | Named buttons, text fields, checkbox, radio group/state, semantic content headings, and Studio form labels are exercised by role                                                      | `tests/e2e/mobile.spec.ts`, `tests/e2e/studio.spec.ts`                       |
| Theme accessibility      | Light, dark, warm, and mono tokens are complete; selection persists and exposes `aria-checked`                                                                                        | `packages/design-system/src/index.test.ts`, `apps/mobile/app/appearance.tsx` |
| Contrast                 | Text, muted text, inputs, placeholders, primary/secondary/ghost actions, tabs, focus rings, media labels, and control borders meet automated WCAG AA thresholds                       | `packages/design-system/src/index.test.ts`                                   |
| Target size              | Shared minimum is 48 logical pixels; custom reader controls use the same token                                                                                                        | `packages/design-system/src/index.ts`                                        |
| Non-color state          | Choice position labels, radio/checkbox state, branch labels/dots, icons, and text accompany color                                                                                     | E2E role assertions and visual attachments                                   |
| Text 100/150/200%        | Explicit persisted sizes exist; at 200%, the four choices remain ordered, keyboard-focusable, selectable, vertically scrollable, and free of horizontal overflow                      | `apps/mobile/app/text-size.tsx`, `tests/e2e/mobile.spec.ts`                  |
| Reduced motion           | Every message-speed mode resolves to instant reveal; typing and media transition durations become zero; persisted switch semantics pass                                               | `apps/mobile/src/domain/reading-motion.test.ts`, `tests/e2e/mobile.spec.ts`  |
| Offline flow             | Core authored play, undo, ending, recap, branch view, and replay pass after browser offline mode is enabled                                                                           | [Playwright report](../../artifacts/playwright-report/index.html)            |
| Visual review            | Catalog, filtering, branch map, warning/safe route, mono theme, 200% choice tray, and Studio release gate inspected at both phone widths and desktop                                  | [Playwright report](../../artifacts/playwright-report/index.html)            |
| Standalone Android smoke | Release APK launches without Metro; API 36 native hierarchy exposes `choice-1` through `choice-4` with valid bounds, ordered labels, and a tappable fourth choice                     | `docs/product/RELEASE_EVIDENCE.md`, `apps/mobile/app/run/[runId].tsx`        |
| iOS native project smoke | Generated Xcode target and Release configuration match Expo bundle/deployment metadata; arm64, portrait, URL scheme, and iPhone/iPad family are checked without requiring a simulator | `tooling/ios-project-smoke.ts`, `docs/quality/PLATFORM_SUPPORT_MATRIX.md`    |

Automated status is green. Manual native release status remains pending below;
no browser emulation is recorded as VoiceOver/TalkBack evidence.

| Surface                          | iPhone / VoiceOver | iPhone large text | Android / TalkBack | Android font 200% | Reduced motion | Switch/keyboard | Owner/evidence   |
| -------------------------------- | ------------------ | ----------------- | ------------------ | ----------------- | -------------- | --------------- | ---------------- |
| Onboarding and disclosure        | Pending            | Pending           | Pending            | Pending           | Pending        | Pending         | Accessibility QA |
| Catalog/search/filter            | Pending            | Pending           | Pending            | Pending           | Pending        | Pending         | Accessibility QA |
| Story detail/warnings/safe route | Pending            | Pending           | Pending            | Pending           | Pending        | Pending         | Accessibility QA |
| Four choices and commit          | Pending            | Pending           | Pending            | Pending           | Pending        | Pending         | Accessibility QA |
| Reaction/pacing/ending           | Pending            | Pending           | Pending            | Pending           | Pending        | Pending         | Accessibility QA |
| Recap/branch/archive             | Pending            | Pending           | Pending            | Pending           | Pending        | Pending         | Accessibility QA |
| Downloads/settings/report        | Pending            | Pending           | Pending            | Pending           | Pending        | Pending         | Accessibility QA |

Minimum physical devices: smallest supported iPhone on iOS 17, current standard iPhone, Android API 29 low-memory phone, current Android phone, and one tablet-sized accessibility check. Verify 44×44 pt / 48×48 dp targets, logical reading order, choice position and intent announcements, no color-only state, no clipped Russian text, focus after navigation, screen-reader feedback after commit, sound-independent feedback, and no required animation.

Attach device model, OS, app/build ID, content build ID, tester, date, failures, and video or screen-reader transcript. Every blocker must link to a retest before store submission.
