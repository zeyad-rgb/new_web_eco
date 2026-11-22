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

test.describe('admin changes reach the storefront', () => {
  test('badge, fit and collection set in the editor appear on the shop page', async ({ page, problems }) => {
    const csrf = await signIn(page, 'e2e-admin@example.test')
    const catalog = await (await page.request.get('/staff/catalog', { headers: json })).json()
    expect(Array.isArray(catalog.collections), 'staff catalog exposes collections').toBe(true)
    const collection = catalog.collections[0]
    expect(collection, 'at least one collection is seeded').toBeTruthy()
    const categorySlug = catalog.categories.find((c: any) => c.parent_slug)?.slug ?? catalog.categories[0].slug
    const colorId = crypto.randomUUID()
    const name = 'E2E Badged Tee'
    const save = await page.request.post('/staff/products', {
      headers: { ...json, 'X-CSRF-TOKEN': csrf },
      data: {
        id: null, name, description: 'Storefront sync check', categoryId: categorySlug, price: 39900, published: true,
        label: 'E2E BADGE', fit: 'Oversized', collections: [collection.slug],
        colorOptions: [{ id: colorId, name: 'Olive', hex: '#4a5d32', images: [] }],
        sizeOptions: ['M'], variants: [{ colorId, size: 'M', stock: 3 }], originalVariants: [],
      },
    })
    expect(save.status(), await save.text()).toBe(200)

    // The public catalog is cached for 30s and the save busts that cache, so the
    // storefront must serve the new product on the next request.
    const published = await page.request.get('/api/v1/products', { headers: { ...json, 'Cache-Control': 'no-cache' } })
    const fromApi = (await published.json()).products.find((p: any) => p.name === name)
    expect(fromApi, 'saved product is in the public catalog').toBeTruthy()
    expect(fromApi.label).toBe('E2E BADGE')
    expect(fromApi.fit).toBe('Oversized')
    expect(fromApi.collections).toContain(collection.slug)

    // The storefront filters by collection and shows the badge on the card.
    // Clear the SWR paint cache first: this tab loaded the shop before the product existed.
    await page.goto('/shop')
    await page.evaluate(() => sessionStorage.removeItem('studioactive_catalog_cache'))
    await page.goto(`/shop?collection=${collection.slug}`)
    await page.waitForLoadState('networkidle')
    // In English the card title shows the badge (locale.getProductName falls back to label).
    const card = page.locator('.product-card-adv', { hasText: 'E2E BADGE' })
    await expect(card).toHaveCount(1)
    await expect(card, 'fit is shown under the title').toContainText('Oversized')
    expect(name).toBeTruthy()
    expect(problems.console).toEqual([])
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
