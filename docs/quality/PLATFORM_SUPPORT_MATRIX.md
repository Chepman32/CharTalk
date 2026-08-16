# Platform support matrix

This is the checked-in support contract for the current release candidate. It
is intentionally separate from the store support statement: a platform is not
publicly supported until the native accessibility, minimum-device, signing,
and store gates are attached to the same release artifact.

| Surface              | Configured target                                                                                            | Engineering evidence                                                                                                                                                                                                                                                                    | Open release evidence                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS reader           | iOS 17+, arm64, bundle ID `app.chartalk.reader`, Expo SDK 57 / React Native 0.86.2, Hermes, New Architecture | `npm run test:ios:project` validates the generated Xcode target, Release configuration, deployment target, URL scheme, arm64, portrait orientation, and iPhone/iPad family support; `npm run test:ios:build` compiles the CocoaPods workspace as an unsigned Release Simulator artifact | Signed device/store artifact; iPhone/iPad VoiceOver, large text, reduced motion, minimum-device performance, kill/resume, rollback, and store-signing run |
| Android reader       | API 29+ / 64-bit, package `app.chartalk.reader`, Hermes, New Architecture                                    | Standalone API 36 emulator smoke launches without Metro and exposes all four choices with valid native bounds; Gradle release signing fails closed without production credentials                                                                                                       | API 29 low-memory phone, large text/TalkBack, kill/resume, rollback, crash-free and commit-success observations, production keystore custody              |
| Web preview / Studio | Current evergreen Chromium; reader preview tested at 320 px and 412 px                                       | Playwright 19/19, offline reader flow, Studio review/grammar/annotation/diff flow, two-tab draft conflict flow, overflow and accessibility assertions                                                                                                                                   | Browser support policy and production hosting/SLO ownership                                                                                               |

## Regenerating native projects

The mobile app uses Expo CNG. From the repository root:

```sh
npx expo prebuild --platform ios --no-install
npm run test:ios:project
# On a macOS release host, require the Xcode listing check explicitly:
npm run test:ios:project:strict
```

Do not commit `apps/mobile/ios/Pods` or generated `build` output. A native
dependency change requires a new binary/runtime review; content packs remain
independent of the JavaScript bundle.

## Current boundary

The repository has a materialized iOS project, a host-independent metadata
smoke, and a reproducible unsigned Simulator Release build. On non-macOS hosts
the default metadata command records an explicit warning when `xcodebuild` is
unavailable; `:strict` turns that warning into a failure. The build command
requires a macOS/Xcode host with CocoaPods and should be run from the repository
root after `cd apps/mobile/ios && pod install`. The public release remains
gated by the manual device/accessibility, content, legal, signing, and
operations evidence listed in
[`RELEASE_EVIDENCE.md`](../product/RELEASE_EVIDENCE.md).
