import { randomUUID } from 'node:crypto'
import { test, expect, expectClean, csrfToken } from './fixtures'

// Customer account journey and the /profile page, against the disposable E2E stack.
const json = { Accept: 'application/json', 'Content-Type': 'application/json' }
const password = 'Customer-e2e-pass-123!'
const newCustomer = () => ({ name: 'E2E Customer', email: `e2e-${randomUUID().slice(0, 8)}@example.test`, phone: '01012345678', password })

test.describe('customer API', () => {
  test('register → session → logout → login', async ({ page }) => {
    const c = newCustomer()
    let csrf = await csrfToken(page)
    const reg = await page.request.post('/customer/register', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: c })
    expect(reg.status(), await reg.text()).toBe(200)
    const regBody = await reg.json()
    expect(regBody.user).toMatchObject({ name: c.name, email: c.email, phone: c.phone, role: 'customer' })
    expect(regBody.user).not.toHaveProperty('password_hash')

    const session = await (await page.request.get('/customer/session', { headers: json })).json()
    expect(session.user?.email).toBe(c.email)

    const out = await page.request.post('/staff/logout', { headers: { ...json, 'X-CSRF-TOKEN': session.csrf } })
    expect(out.status()).toBe(200)
    csrf = (await out.json()).csrf
    expect((await (await page.request.get('/customer/session', { headers: json })).json()).user).toBeNull()

    const login = await page.request.post('/customer/login', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { email: c.email.toUpperCase(), password } })
    expect(login.status(), 'email should be case-insensitive').toBe(200)
  })

  test('registration validation', async ({ page }) => {
    const csrf = await csrfToken(page)
    const headers = { ...json, 'X-CSRF-TOKEN': csrf }
    expect((await page.request.post('/customer/register', { headers, data: { ...newCustomer(), password: 'short' } })).status(), 'password < 12 chars').toBe(422)
    expect((await page.request.post('/customer/register', { headers, data: { ...newCustomer(), phone: '12345' } })).status(), 'invalid Egyptian mobile').toBe(422)
    expect((await page.request.post('/customer/register', { headers, data: { ...newCustomer(), email: 'e2e-admin@example.test' } })).status(), 'staff email cannot register').toBe(422)
  })

  test('wrong password is rejected without leaking details', async ({ page }) => {
    const csrf = await csrfToken(page)
    const res = await page.request.post('/customer/login', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { email: 'nobody@example.test', password: 'wrong-password-1' } })
    expect(res.status()).toBe(422)
    expect(JSON.stringify(await res.json())).not.toMatch(/sql|exception|trace/i)
  })
})

test.describe('/profile page', () => {
  test('shows the signed-in customer and survives a reload', async ({ page, problems }) => {
    const c = newCustomer()
    await page.goto('/register')
    const csrf = await csrfToken(page)
    expect((await page.request.post('/customer/register', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: c })).status()).toBe(200)
    await page.goto('/login') // App.vue refreshes the customer session on mount
    await page.evaluate((u) => localStorage.setItem('ecomars_auth', JSON.stringify({ user: u })), { id: 'x', name: c.name, email: c.email, phone: c.phone, role: 'customer' })
    await page.goto('/profile')
    await expect(page.getByText(c.email)).toBeVisible()
    await expect(page.getByText(c.phone)).toBeVisible()
    await page.reload()
    await expect(page.getByText(c.email)).toBeVisible()
    await expectClean(problems)
  })

  test('tracks the customer’s own order', async ({ page }) => {
    const csrf = await csrfToken(page)
    const order = await page.request.post('/api/v1/orders', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { request_id: randomUUID(), name: 'Track Test', phone: '01012345678', address: 'Cairo - Nasr City - street 9', items: [{ sku: 'training-tee-1-M', quantity: 1 }] } })
    expect(order.status(), await order.text()).toBe(201)
    const { id, total } = await order.json()
    const track = await page.request.post('/api/v1/orders/track', { headers: json, data: { order_id: id } })
    expect(track.status()).toBe(200)
    const body = await track.json()
    expect(body.total).toBe(total)
    expect(JSON.stringify(body), 'full phone must not be exposed').not.toContain('01012345678')
    expect(body.customer_name).toMatch(/\*\*\*/)
    expect((await page.request.post('/api/v1/orders/track', { headers: json, data: { order_id: randomUUID() } })).status()).toBe(404)
  })

  // Known issues found in this audit (CUST-xx in audit-reports/CUSTOMER_ACCOUNT_AUDIT.md).
  test('anonymous visitor is redirected away from /profile (CUST-01)', async ({ page }) => {
    test.fail(true, 'CUST-01: /profile has no route guard and renders placeholder data for anonymous visitors')
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('profile does not show stale data after the server session ends', async ({ page }) => {
    // App.vue re-validates a persisted customer against /customer/session on mount.
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('ecomars_auth', JSON.stringify({ user: { id: 'gone', name: 'Stale User', email: 'stale@example.test', phone: '01099999999', role: 'customer' } })))
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('stale@example.test')).toHaveCount(0)
  })
})
