import { test as base, expect, type Page } from '@playwright/test'

// Collects console errors, page errors and failed/5xx requests for every test.
// Tests fail if the page produced any, so regressions surface without screenshots.
type Problems = { console: string[]; failed: string[] }

export const test = base.extend<{ problems: Problems }>({
  problems: async ({ page }, use, testInfo) => {
    const problems: Problems = { console: [], failed: [] }
    page.on('console', (msg) => { if (msg.type() === 'error') problems.console.push(msg.text()) })
    page.on('pageerror', (err) => problems.console.push(`pageerror: ${err.message}`))
    page.on('requestfailed', (req) => {
      const reason = req.failure()?.errorText ?? ''
      if (!reason.includes('ERR_ABORTED')) problems.failed.push(`${req.method()} ${req.url()} ${reason}`)
    })
    page.on('response', (res) => { if (res.status() >= 500) problems.failed.push(`${res.status()} ${res.request().method()} ${res.url()}`) })
    await use(problems)
    if (problems.console.length || problems.failed.length) {
      await testInfo.attach('browser-problems.json', { body: JSON.stringify(problems, null, 2), contentType: 'application/json' })
    }
  },
})

export { expect }

export async function expectClean(problems: Problems) {
  expect.soft(problems.console, 'browser console errors').toEqual([])
  expect.soft(problems.failed, 'failed or 5xx network requests').toEqual([])
}

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'page wider than viewport').toBeLessThanOrEqual(1)
}

/** Fetches a CSRF token the same way the SPA does (session endpoint sets the XSRF cookie). */
export async function csrfToken(page: Page): Promise<string> {
  const res = await page.request.get('/customer/session', { headers: { Accept: 'application/json' } })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  return body.csrf ?? ''
}
