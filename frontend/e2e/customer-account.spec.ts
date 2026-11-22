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
    // No localStorage seeding: the /profile route guard must restore the user from the server session.
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByText(c.email)).toBeVisible()
    await expect(page.getByText(c.phone)).toBeVisible()
    await page.reload()
    await expect(page.getByText(c.email)).toBeVisible()
    await expectClean(problems)
  })

  test('lists the customer’s own orders and lets them track one (CUST-06)', async ({ page, problems }) => {
    const c = newCustomer()
    await page.goto('/register')
    const csrf = await csrfToken(page)
    expect((await page.request.post('/customer/register', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: c })).status()).toBe(200)
    await page.goto('/profile')
    await expect(page.getByText(/No orders yet|لا توجد طلبات بعد/)).toBeVisible()

    const session = await (await page.request.get('/customer/session', { headers: json })).json()
    const order = await page.request.post('/api/v1/orders', { headers: { ...json, 'X-CSRF-TOKEN': session.csrf }, data: { request_id: randomUUID(), name: c.name, phone: c.phone, address: 'Giza - Dokki - street 3', items: [{ sku: 'training-tee-2-L', quantity: 2 }] } })
    expect(order.status(), await order.text()).toBe(201)
    const { id } = await order.json()

    await page.reload()
    const row = page.locator('[data-test="my-order"]')
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(id.slice(0, 8).toUpperCase())
    await row.getByRole('button').click()
    await expect(page.locator('.tracking-result-box')).toBeVisible()
    await expectClean(problems)
  })

  test('shows no placeholder or unfulfilled promises (CUST-02/03/04)', async ({ page }) => {
    const c = newCustomer()
    await page.goto('/register')
    const csrf = await csrfToken(page)
    expect((await page.request.post('/customer/register', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: c })).status()).toBe(200)

    for (const path of ['/profile', '/login', '/register']) {
      if (path !== '/profile') await page.request.post('/staff/logout', { headers: { ...json, 'X-CSRF-TOKEN': (await (await page.request.get('/customer/session', { headers: json })).json()).csrf } })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const text = await page.locator('#app').innerText()
      for (const claim of ['Demo Customer', 'SILVER', 'Reward Points', 'نقطة', 'points', '800', '10%', '١٠٪', 'Birthday', 'ميلادك']) {
        expect(text, `${path} must not show "${claim}"`).not.toContain(claim)
      }
    }
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

  test('anonymous visitor is redirected away from /profile (CUST-01)', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await expect(page.getByText('Demo Customer')).toHaveCount(0)
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
