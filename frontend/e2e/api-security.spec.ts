import { randomUUID } from 'node:crypto'
import { test, expect, csrfToken } from './fixtures'

// Non-destructive security and business-integrity checks against the local E2E stack.
const json = { Accept: 'application/json', 'Content-Type': 'application/json' }
const order = (overrides: Record<string, unknown> = {}) => ({
  request_id: randomUUID(), name: 'Security Test', phone: '01012345678', address: 'Cairo security test address',
  items: [{ sku: 'training-tee-0-L', quantity: 1 }], payment_method: 'cod', ...overrides,
})

test.describe('access control', () => {
  for (const path of ['/staff/bundle', '/staff/orders', '/staff/customers', '/staff/settings', '/staff/audit']) {
    test(`anonymous GET ${path} is rejected`, async ({ request }) => {
      const res = await request.get(path, { headers: json })
      expect([401, 403]).toContain(res.status())
    })
  }

  test('catalog manager cannot read orders or settings', async ({ page }) => {
    const csrf = await csrfToken(page)
    const login = await page.request.post('/staff/dispatch-login', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { email: 'e2e-manager@example.test', password: 'E2e-test-password-123!' } })
    expect(login.status(), await login.text()).toBe(200)
    expect((await page.request.get('/staff/orders', { headers: json })).status()).toBe(403)
    expect((await page.request.get('/staff/settings', { headers: json })).status()).toBe(403)
  })
})

test.describe('CSRF', () => {
  test('order without CSRF token is rejected', async ({ page }) => {
    await page.request.get('/customer/session', { headers: json })
    const res = await page.request.post('/api/v1/orders', { headers: json, data: order() })
    expect(res.status()).toBe(419)
  })

  test('staff login without CSRF token is rejected', async ({ page }) => {
    await page.request.get('/customer/session', { headers: json })
    const res = await page.request.post('/staff/login', { headers: json, data: { email: 'e2e-admin@example.test', password: 'E2e-test-password-123!' } })
    expect(res.status()).toBe(419)
  })
})

test.describe('order integrity', () => {
  test('client-supplied prices are ignored and retries are idempotent', async ({ page }) => {
    const csrf = await csrfToken(page)
    const headers = { ...json, 'X-CSRF-TOKEN': csrf }
    const payload = order({ items: [{ sku: 'training-tee-0-L', quantity: 1 }] })
    const tampered = await page.request.post('/api/v1/orders', { headers, data: { ...payload, total: 1, items: [{ sku: 'training-tee-0-L', quantity: 1, price: 1 }] } })
    expect(tampered.status(), 'unexpected item fields must be rejected').toBe(422)

    const first = await page.request.post('/api/v1/orders', { headers, data: payload })
    expect(first.status(), await first.text()).toBe(201)
    const created = await first.json()
    const quote = await page.request.post('/checkout/quote', { headers, data: { items: payload.items } })
    expect(quote.status()).toBe(200)
    expect(created.total).toBe((await quote.json()).total)

    const retry = await page.request.post('/api/v1/orders', { headers, data: payload })
    expect(retry.status()).toBe(200)
    expect((await retry.json()).id).toBe(created.id)

    const changed = await page.request.post('/api/v1/orders', { headers, data: { ...payload, address: 'Different address for same key' } })
    expect(changed.status(), 'same idempotency key with different body').toBe(409)
  })

  test('overselling is rejected', async ({ page }) => {
    const csrf = await csrfToken(page)
    const res = await page.request.post('/api/v1/orders', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: order({ items: [{ sku: 'training-shorts-0-3XL', quantity: 1 }] }) })
    expect(res.status()).toBe(409)
  })

  test('non-COD payment methods are rejected by the API', async ({ page }) => {
    const csrf = await csrfToken(page)
    const res = await page.request.post('/api/v1/orders', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: order({ payment_method: 'card' }) })
    expect(res.status()).toBe(422)
  })
})

// Known open finding SEC-03 (audit-reports/SECURITY_AUDIT.md): marked test.fail so the
// suite stays green while the issue is open. When headers are fixed this test will
// "unexpectedly pass" — then remove the test.fail line.
test('security headers on the API (SEC-03)', async ({ request }, testInfo) => {
  test.fail(true, 'SEC-03: Laravel sends no security headers; nginx only covers some locations and has no CSP')
  const res = await request.get('http://127.0.0.1:8018/api/v1/products', { headers: json })
  const h = res.headers()
  const expected = ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'content-security-policy', 'strict-transport-security']
  const missing = expected.filter((name) => !h[name])
  await testInfo.attach('security-headers.json', { body: JSON.stringify({ present: h, missing }, null, 2), contentType: 'application/json' })
  console.log(`HEADERS missing=${JSON.stringify(missing)}`)
  // HSTS is only meaningful over HTTPS (set at the proxy); everything else should be present.
  expect(missing.filter((m) => m !== 'strict-transport-security'), 'missing security headers').toEqual([])
})
