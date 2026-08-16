import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'artifacts/coverage',
      include: [
        'packages/app-core/src/**/*.ts',
        'packages/content-compiler/src/**/*.ts',
        'packages/content-schema/src/**/*.ts',
        'packages/design-system/src/**/*.ts',
        'packages/dialogue-engine/src/**/*.ts',
        'services/api/src/app.ts',
        'services/api/src/bootstrap.ts',
        'services/api/src/storage.ts',
        'apps/mobile/src/domain/**/*.ts',
        'apps/mobile/src/services/**/*.ts',
        'apps/mobile/src/format.ts',
        'apps/mobile/src/ui/text-scale.ts',
        'apps/content-studio/src/domain/**/*.ts',
      ],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/fixtures/**'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
        'packages/app-core/src/**/*.ts': {
          branches: 80,
          lines: 80,
        },
        'packages/dialogue-engine/src/**/*.ts': {
          branches: 95,
          statements: 95,
        },
      },
    },
    include: [
      'packages/**/*.test.ts',
      'services/**/*.test.ts',
      'apps/mobile/src/**/*.test.ts',
      'apps/content-studio/src/**/*.test.ts',
      'tooling/**/*.test.ts',
    ],
    passWithNoTests: false,
    restoreMocks: true,
  },
})
