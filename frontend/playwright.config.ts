import { defineConfig, devices } from '@playwright/test'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

// Absolute PHP path so the web server works from any shell (cmd, PowerShell, Git Bash, CI).
// Override with PHP_BINARY if needed.
export const php = process.env.PHP_BINARY || (() => {
  try {
    const cmd = process.platform === 'win32' ? 'where php' : 'command -v php'
    return execSync(cmd, { encoding: 'utf8' }).split(/\r?\n/)[0].trim() || 'php'
  } catch { return 'php' }
})()

// E2E runs against a disposable SQLite database (backend/database/e2e.sqlite),
// never the development or production database. See e2e/global-setup.ts.
// Ports 8018/5183 keep it clear of a running dev stack (8008/5173).
const backendDir = path.resolve(here, '../backend')
const e2eDb = path.join(backendDir, 'database', 'e2e.sqlite').replace(/\\/g, '/')
export const e2eEnv = {
  // 'local', not 'testing': Laravel skips CSRF verification when APP_ENV=testing,
  // which would hide CSRF regressions in browser tests.
  APP_ENV: 'local',
  APP_DEBUG: 'false',
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: e2eDb,
  CACHE_STORE: 'array',
  SESSION_DRIVER: 'file',
  QUEUE_CONNECTION: 'database',
  WHATSAPP_ENABLED: 'false',
}

export default defineConfig({
  testDir: './e2e',
  outputDir: '../audit-reports/raw/playwright-artifacts',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: '../audit-reports/raw/playwright-results.json' }],
    ['html', { outputFolder: '../audit-reports/raw/playwright-html', open: 'never' }],
  ],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://127.0.0.1:5183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, grep: /@responsive/ },
  ],
  webServer: [
    {
      command: `"${php}" artisan serve --host=127.0.0.1 --port=8018`,
      cwd: backendDir,
      url: 'http://127.0.0.1:8018/up',
      env: { ...(process.env as Record<string, string>), ...e2eEnv },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npx vite --host 127.0.0.1 --port 5183 --strictPort',
      env: { ...(process.env as Record<string, string>), VITE_API_TARGET: 'http://127.0.0.1:8018' },
      cwd: here,
      url: 'http://127.0.0.1:5183',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
