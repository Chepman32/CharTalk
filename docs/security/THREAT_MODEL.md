# Threat model

## Scope and trust boundaries

Развилка has four principal boundaries: the untrusted mobile client; immutable signed content; the public API; and the restricted editorial/publishing environment. A modified client is expected. Client-computed state, content versions, entitlements, and endings are never server authority. Cloud sync and payments are deliberately disabled by the v1 decision register.

## Protected assets

- reader progress, reports, consent timestamps, and optional diagnostic metadata;
- authored unpublished content and production package signing keys;
- package integrity, exact-build replay, and editorial approval evidence;
- API and content availability.

## Threats and controls

| Threat                            | Control                                                                                                                                                                     | Verification                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Package substitution or downgrade | Ed25519 signature, canonical checksum, immutable build ID, engine compatibility range, atomic activation, retained rollback build                                           | Signing/tamper/install tests                   |
| Malicious or malformed content    | Strict Zod schema, declarative condition/effect operators, no code evaluation, 64 KiB public / 64 MiB publisher request ceilings, compiler graph and placeholder validation | Compiler mutation tests and API contract tests |
| Choice loss or double application | SQLite WAL transaction, operation ID, expected node/build/sequence, unique event constraints, replay hash                                                                   | Crash/idempotency/replay tests                 |
| Admin brute force or token leak   | Constant-time token comparison, 24-character production minimum, separate admin rate bucket, file-mounted keys, TLS gateway and secret rotation                             | API tests and key-custody drill                |
| Reader privacy leakage            | Guest-first operation, data minimization, strict report/diagnostic schemas, explicit report consent, no raw dialogue analytics                                              | Rejection tests and payload review             |
| API resource exhaustion           | Body-size limit, per-client rate limit, readiness probe, cacheable catalog, immutable artifacts, reverse-proxy limits                                                       | Load test and alerting                         |
| Spoofed client IP                 | Deployment proxy replaces `X-Real-IP`; direct public access to the container is denied                                                                                      | Infrastructure review                          |
| Cross-origin abuse                | Explicit origin allowlist; native clients do not rely on CORS as authentication                                                                                             | API preflight tests                            |
| Database or device loss           | OS sandbox/encryption, WAL, backup/restore runbook, local export, content redownload                                                                                        | Recovery drill                                 |
| Unsafe dependency parser input    | Non-advancing ICNS/JXL boxes are locally patched and hang-regression tested; build workers consume reviewed assets; downloaded media never enters Metro                     | Dependency exception and patch test            |
| Cleartext service configuration   | Mobile reports, diagnostics, package downloads, and Studio publishing require HTTPS; HTTP is accepted only for exact loopback development hosts                             | Endpoint policy unit tests                     |

## Deployment assumptions

- TLS 1.2+ terminates at a managed ingress. It overwrites forwarding headers, caps public writes at 64 KiB and restricted content publication at 64 MiB, applies network-level rate limiting, and allows admin routes only through the publisher identity boundary.
- The API filesystem is read-only except for `/app/var`; content and public keys are read-only mounts. A signing key is absent from ordinary serving replicas.
- Serving and publishing should be separate deployments. The publisher has no public ingress and uses a hardware-backed or managed signing key in production.
- Logs contain request IDs and error classes, not request bodies, transcript text, tokens, or signing material.
- The repository secret scanner reports only rule/file/line metadata and never echoes a detected credential value.

## Residual and external risks

Human editorial abuse, legal classification, production RBAC, key custody, penetration testing, mobile binary hardening, and store review require named owners and signed evidence. They cannot be established by repository code alone and remain explicit release gates.
