/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  mutate: [
    'packages/dialogue-engine/src/index.ts:80-185',
    'packages/dialogue-engine/src/index.ts:237-395',
  ],
  // Native build products are not part of the JavaScript mutation sandbox.
  // Ignoring them keeps mutation verification reproducible after CocoaPods
  // has materialized its xcframework bundles locally.
  ignorePatterns: [
    'apps/mobile/ios/Pods/**',
    'apps/mobile/ios/build/**',
    '.stryker-tmp/**',
  ],
  vitest: {
    configFile: 'vitest.config.ts',
    related: true,
  },
  reporters: ['clear-text', 'progress', 'json'],
  jsonReporter: {
    fileName: 'artifacts/mutation/mutation.json',
  },
  thresholds: {
    high: 90,
    low: 85,
    break: 85,
  },
  mutator: {
    excludedMutations: ['StringLiteral'],
  },
  concurrency: 4,
  timeoutMS: 5000,
}
