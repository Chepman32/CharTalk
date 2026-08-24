import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }],
  ],
  use: {
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:8090' },
    },
    {
      name: 'small-phone',
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices['iPhone SE'],
        browserName: 'chromium',
        baseURL: 'http://127.0.0.1:8090',
      },
    },
    {
      name: 'studio-chromium',
      testMatch: /studio\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5174' },
    },
  ],
  webServer: [
    {
      command:
        'npm exec vite -- preview apps/mobile --host 127.0.0.1 --port 8090 --strictPort',
      url: 'http://127.0.0.1:8090',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        'npm run dev --workspace @razvilka/content-studio -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
