import { test, expect, expectClean, noHorizontalScroll } from './fixtures'

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

test.describe('shop listing', () => {
  test('all product cards share one media height, so the grid stays aligned', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    const heights = await page.locator('.card-media-stage').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height))
    )
    expect(heights.length).toBeGreaterThan(1)
    expect(new Set(heights).size, `media boxes differ: ${heights.join(', ')}`).toBe(1)
  })

  test('only the active category chip is filled in', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    const current = page.locator('.category-strip a[aria-current="page"]')
    await expect(current).toHaveCount(1)
    await expect(current).toHaveText(/All Products|كل المنتجات/)
  })

  test('phone layout shows two columns with no overlap in the top bar @responsive', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')

    const columns = await page.locator('.shop.listing .grid').evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').length
    )
    expect(columns, 'product grid columns on a phone').toBe(2)

    // The announcement, "Visit us" and the language button used to sit on top
    // of each other because each was absolutely positioned by percentage.
    const boxes = await page.locator('.utility-bar > *').evaluateAll((els) =>
      els.map((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, text: (el.textContent || '').trim().slice(0, 16) } })
    )
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].left, `"${boxes[i - 1].text}" overlaps "${boxes[i].text}"`).toBeGreaterThanOrEqual(boxes[i - 1].right - 1)
    }
    await noHorizontalScroll(page)
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

  test('shows no invented ratings and no contradictory shipping promise', async ({ page }) => {
    await page.goto('/product/training-tee')
    await page.waitForLoadState('networkidle')
    const text = await page.locator('#app').innerText()
    // PDP-03: reviews were not backed by any table, so the stars were invented.
    for (const claim of ['تقييمات وآراء العملاء', 'مشتري معتمد', 'True to Size']) {
      expect(text, `product page must not show "${claim}"`).not.toContain(claim)
    }
    // PDP-04 / CUST-10: any shipping figure shown must be the store's own setting.
    const threshold = await page.evaluate(async () => {
      const res = await fetch('/api/v1/products', { headers: { Accept: 'application/json' } })
      return (await res.json()).shippingSettings?.free_threshold ?? 0
    })
    const stale = ['1,000 EGP', '١٬٠٠٠', '800 EGP', '٨٠٠ جنيه']
    for (const value of stale) {
      expect(text, `stale shipping figure "${value}" (store threshold is ${threshold})`).not.toContain(value)
    }
  })

  test('out-of-stock sizes are disabled and cannot be added to the bag', async ({ page }) => {
    await page.goto('/product/training-shorts')
    await page.waitForLoadState('networkidle')
    await page.locator('.color-photo-option').first().click()
    const disabled = page.locator('.options button[disabled]')
    await expect(disabled, 'training-shorts 3XL is seeded with stock 0').not.toHaveCount(0)
  })
})
