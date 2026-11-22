import { test, expect, expectClean } from './fixtures'

// Full customer journey through the real UI and API (cash on delivery, E2E DB only).
test('customer buys a product with cash on delivery', async ({ page, problems }) => {
  await page.goto('/product/training-tee')
  await page.waitForLoadState('networkidle')

  await page.locator('.color-photo-option').first().click()
  const size = page.locator('.options button:not([disabled])').first()
  await expect(size).toBeVisible()
  await size.click()

  const add = page.locator('.add-to-bag-btn').first()
  await expect(add).toBeEnabled()
  await add.click()

  await page.goto('/checkout')
  const form = page.locator('#checkout-form')
  await expect(form).toBeVisible()
  await form.locator('input').nth(0).fill('E2E Shopper')
  await form.locator('input[placeholder="01xxxxxxxxx"]').fill('01012345678')
  await form.locator('select').first().selectOption({ index: 1 })
  const textInputs = form.locator('input[type="text"], input:not([type]), textarea')
  // City and street address are the remaining required free-text fields.
  for (const field of await textInputs.all()) {
    if (await field.isVisible() && !(await field.inputValue()) && (await field.getAttribute('required')) !== null) await field.fill('Cairo E2E street 1')
  }

  const orderResponse = page.waitForResponse((r) => r.url().endsWith('/api/v1/orders') && r.request().method() === 'POST')
  await page.locator('button[type="submit"][form="checkout-form"], #checkout-form button[type="submit"]').first().click()
  const res = await orderResponse
  expect(res.status(), await res.text()).toBe(201)
  const order = await res.json()
  expect(order.id).toMatch(/[0-9a-f-]{36}/)
  expect(order.total).toBeGreaterThan(0)

  await expect(page).toHaveURL(/\/receipt/)
  await expectClean(problems)
})
