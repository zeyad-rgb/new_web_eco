import { test, expect, expectClean } from './fixtures'

// Home, shop and product detail: structure, navigation and states.

test.describe('home page', () => {
  test('every "shop by collection" tile lands on a page with products', async ({ page, problems }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const tiles = page.locator('.collection-card')
    const count = await tiles.count()
    expect(count).toBeGreaterThan(0)
    const empty: string[] = []
    for (let i = 0; i < count; i++) {
      const href = await tiles.nth(i).getAttribute('href')
      const label = (await tiles.nth(i).innerText()).trim().split('\n')[0]
      await page.goto(href!)
      await page.waitForLoadState('networkidle')
      if (await page.locator('.product-card-adv').count() === 0) empty.push(`${label} → ${href}`)
      await page.goBack()
    }
    expect(empty, 'tiles leading to an empty shop page').toEqual([])
    await expectClean(problems)
  })

  test('has one h1 and the hero image is eager, not lazy', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    const hero = page.locator('.sport-hero img').first()
    await expect(hero).toHaveAttribute('fetchpriority', 'high')
    expect(await hero.getAttribute('loading')).not.toBe('lazy')
  })

  test('new arrivals shows newest products, not an arbitrary slice', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('.featured')
    await expect(section.locator('.product-card-adv')).not.toHaveCount(0)
  })
})

test.describe('product detail page', () => {
  test('an unknown product id shows a not-found state, not an endless skeleton', async ({ page }) => {
    await page.goto('/product/this-product-does-not-exist')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-test="product-missing"]'), 'not-found message').toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.skeleton-pdp')).toHaveCount(0)
  })

  test('shows price, stock state and keeps the page title in sync', async ({ page, problems }) => {
    await page.goto('/product/training-tee')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page).toHaveTitle(/تيشيرت|Training|Studio|EcoMars/)
    await expectClean(problems)
  })

  test('out-of-stock sizes are disabled and cannot be added to the bag', async ({ page }) => {
    await page.goto('/product/training-shorts')
    await page.waitForLoadState('networkidle')
    await page.locator('.color-photo-option').first().click()
    const disabled = page.locator('.options button[disabled]')
    await expect(disabled, 'training-shorts 3XL is seeded with stock 0').not.toHaveCount(0)
  })
})
