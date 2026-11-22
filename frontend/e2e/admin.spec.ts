import { test, expect, csrfToken } from './fixtures'
import type { Page } from '@playwright/test'

// Admin control center, against the disposable E2E stack (staff accounts from global-setup).
const json = { Accept: 'application/json', 'Content-Type': 'application/json' }
const PASSWORD = 'E2e-test-password-123!'

async function signIn(page: Page, email: string) {
  await page.goto('/login')
  const csrf = await csrfToken(page)
  const res = await page.request.post('/staff/dispatch-login', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { email, password: PASSWORD } })
  expect(res.status(), await res.text()).toBe(200)
  return (await res.json()).csrf as string
}

const sections = ['dashboard', 'products', 'categories', 'orders', 'customers', 'settings', 'audit']

test.describe('admin role', () => {
  for (const section of sections) {
    test(`admin opens /admin/${section} cleanly`, async ({ page, problems }) => {
      const forbidden: string[] = []
      page.on('response', (r) => { if ([401, 403, 419, 422].includes(r.status())) forbidden.push(`${r.status()} ${r.url()}`) })
      await signIn(page, 'e2e-admin@example.test')
      await page.goto(`/admin/${section}`)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(new RegExp(`/admin/${section}`))
      expect(forbidden, 'auth errors while loading').toEqual([])
      expect(problems.console, 'console errors').toEqual([])
      expect(problems.failed, 'failed requests').toEqual([])
    })
  }

  test('settings page loaded directly shows the saved settings, not defaults', async ({ page }) => {
    const csrf = await signIn(page, 'e2e-admin@example.test')
    const saved = { fee: 7000, free_threshold: 123400, currency: 'EGP', express_available: false, estimated_days: '3 أيام' }
    const put = await page.request.put('/staff/settings/shipping', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { value: saved } })
    expect(put.status(), await put.text()).toBe(200)
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    const values = await page.locator('input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
    expect(values.join('|'), 'free-shipping threshold from the database').toMatch(/1234|123400/)
    expect(values, 'fake default discount codes').not.toContain('WELCOME10')
  })
})

test.describe('admin workflows', () => {
  test('order status menu offers only allowed transitions, and the status filter queries the server', async ({ page, problems }) => {
    const csrf = await signIn(page, 'e2e-admin@example.test')
    const order = await page.request.post('/api/v1/orders', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { request_id: crypto.randomUUID(), name: 'Admin Flow', phone: '01012345678', address: 'Cairo admin flow street', items: [{ sku: 'training-tee-0-XL', quantity: 1 }] } })
    expect(order.status(), await order.text()).toBe(201)
    const { id } = await order.json()

    await page.goto('/admin/orders')
    await page.waitForLoadState('networkidle')
    const card = page.locator('.order-manage-card', { hasText: id.slice(0, 8) })
    await expect(card).toHaveCount(1)
    const options = await card.locator('select.status-select option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value))
    expect(options).toEqual(['processing', 'shipped', 'cancelled'])

    await card.locator('select.status-select').selectOption('shipped')
    await expect(card.locator('select.status-select')).toHaveValue('shipped')
    const shippedOptions = await card.locator('select.status-select option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value))
    expect(shippedOptions).toEqual(['shipped', 'delivered', 'returned'])

    const filtered = page.waitForResponse((r) => r.url().includes('/staff/orders?') && r.url().includes('status=shipped'))
    await page.locator('select.filter-select').first().selectOption('shipped')
    await filtered
    await expect(page.locator('.order-manage-card', { hasText: id.slice(0, 8) })).toHaveCount(1)
    expect(problems.console).toEqual([])
  })

  test('dashboard lists variants that need restocking', async ({ page }) => {
    await signIn(page, 'e2e-admin@example.test')
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    // training-shorts 3XL is seeded with stock 0.
    await expect(page.locator('[data-test="restock-panel"]')).toContainText('3XL')
  })

  test('deleting a product with sales is refused with a clear message', async ({ page }) => {
    const csrf = await signIn(page, 'e2e-admin@example.test')
    // training-tee has orders from earlier specs in this run (and from this one if run alone).
    await page.request.post('/api/v1/orders', { headers: { ...json, 'X-CSRF-TOKEN': csrf }, data: { request_id: crypto.randomUUID(), name: 'Del Test', phone: '01012345678', address: 'Cairo delete test street', items: [{ sku: 'training-tee-1-XL', quantity: 1 }] } })
    const res = await page.request.delete('/staff/products/training-tee', { headers: { ...json, 'X-CSRF-TOKEN': csrf } })
    expect(res.status()).toBe(409)
    expect((await res.json()).message).toContain('مسودة')
  })
})

test.describe('catalog manager role', () => {
  test('menu only offers sections the role can use, and none of them error', async ({ page, problems }) => {
    const forbidden: string[] = []
    page.on('response', (r) => { if (r.status() === 403) forbidden.push(r.url()) })
    await signIn(page, 'e2e-manager@example.test')
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    const links = await page.locator('.sidebar-link').evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    for (const href of links) {
      if (!href) continue
      await page.goto(href)
      await page.waitForLoadState('networkidle')
    }
    expect(forbidden, `menu links that hit 403: ${links.join(', ')}`).toEqual([])
    expect(problems.console).toEqual([])
  })
})
