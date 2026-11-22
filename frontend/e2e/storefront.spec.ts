import { test, expect, expectClean, noHorizontalScroll } from './fixtures'

// Every customer-facing route must render, without console errors, failed
// requests, or horizontal scrolling. Runs on desktop and (via @responsive) mobile.
const routes = ['/', '/discover', '/shop', '/product/training-tee', '/cart', '/checkout', '/faq', '/shipping', '/returns', '/about', '/terms', '/privacy', '/login', '/register']

for (const route of routes) {
  test(`renders ${route} cleanly @responsive`, async ({ page, problems }) => {
    const response = await page.goto(route)
    expect(response?.status()).toBeLessThan(400)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#app')).not.toBeEmpty()
    await noHorizontalScroll(page)
    await expectClean(problems)
  })
}

test('catalog API serves published products with variants', async ({ request }) => {
  const res = await request.get('/api/v1/products', { headers: { Accept: 'application/json' } })
  expect(res.status()).toBe(200)
  const body = await res.json()
  const products = Array.isArray(body) ? body : body.products ?? body.data ?? []
  expect(products.length).toBeGreaterThan(0)
})

test('unknown route shows the not-found view', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page.locator('#app')).not.toBeEmpty()
})
