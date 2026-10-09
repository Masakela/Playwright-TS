import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

// Multiple environments (cheatsheet #7): baseURL comes from AGENT_BASE_URL, never
// hard-coded. CI/CD + observability (architecture doc): retries, trace, screenshots,
// video, HTML report. Projects (cheatsheet #10): one suite, three browser engines.
const BASE_URL = process.env.AGENT_BASE_URL || 'https://agent.local';

// Reporters: list + HTML always; JSON (for the KPI script) always; Allure only when
// ALLURE=1 so local `npm test` works even without allure-playwright installed.
const reporters: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
];
if (process.env.ALLURE) {
  reporters.push(['allure-playwright', { resultsDir: 'allure-results' }]);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: reporters,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
