# ADR-001: runtime and monorepo

- Status: accepted
- Date: 2026-08-13

## Decision

Use an npm-workspaces TypeScript monorepo. The reader app uses Expo SDK 57, React Native 0.86, React 19.2.3, Hermes, the mandatory New Architecture, and Expo Router. Node services and tools require Node 22.13 or newer.

## Rationale

Expo SDK 57 is the current stable SDK at kickoff and maps to React Native 0.86. Shared engine/schema packages must execute in React Native, Node, browser preview, and compiler tests without platform imports.

## Consequences

- Dependency versions are lockfile-pinned.
- Native-library upgrades require `expo-doctor`, native build, and minimum-device checks.
- Experimental navigation primitives are excluded from production routes.
