# Dependency risk register

Last reviewed: 2026-08-13. Owner: Mobile Engineering and Security. Next review: before every release or 2026-09-13, whichever comes first.

`npm audit` currently reports 22 transitive findings (8 moderate, 14 high, 0 critical) through the Expo 57 / React Native 0.86 toolchain. Its proposed remediation downgrades to incompatible Expo 53 / React Native 0.72 lines and is not an acceptable security fix. `npm audit fix --force` is prohibited.

## Accepted until compatible upstream resolution

| Advisory            | Dependency path and exposure                                        | Compensating control                                                                                                                                         | Exit condition                                                                    |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| GHSA-w3rx-r6r6-pgpr | `image-size@1.2.1` through Metro; infinite loop on crafted ICNS     | Reproducible `patch-package` guard rejects non-advancing entries; subprocess regression test proves termination; release workers accept reviewed assets only | Remove the local patch after the Expo-compatible Metro chain ships a fixed parser |
| GHSA-5p2g-fcmc-qvqq | `image-size@1.2.1` through Metro; infinite loop on crafted JXL/HEIF | The same local guard rejects ISO BMFF boxes smaller than their header; JXL/HEIF are not accepted content-package asset types                                 | Remove the local patch after a compatible fixed release                           |
| GHSA-w5hq-g745-h8pq | `uuid` through the Xcode project-generation utility                 | Build-time only; Развилка does not call vulnerable buffer-based UUID variants; native projects are generated from reviewed config                            | Expo config plugins move to `uuid>=11.1.1`                                        |

The remaining audit entries inherit severity from these toolchain paths and broad npm ranges across Expo, Metro, React Native, Reanimated, and Worklets. They do not add a separately identified runtime advisory in the current audit response. Production API output is an esbuild bundle and does not include the mobile build toolchain.

## Enforcement

- CI blocks critical advisories and records high/moderate findings for review.
- `postinstall` reapplies `patches/image-size+1.2.1.patch`; `image-size-security.test.ts` fails if either malformed parser probe hangs.
- Lockfile changes require the full verification suite and an Expo compatibility check.
- Untrusted user media and repository pull requests must never run on privileged release workers.
- If a runtime-reachable advisory, critical severity, exploit evidence, or accepted-input expansion appears, this exception expires immediately and release is blocked.
