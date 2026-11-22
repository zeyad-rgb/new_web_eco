import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './fixtures'

// WCAG 2.1 A/AA scan. Fails on critical violations; serious and lower are
// recorded in the attached report so the audit can track them.
for (const route of ['/', '/shop', '/product/training-tee', '/cart', '/checkout', '/login']) {
  test(`axe scan ${route}`, async ({ page }, testInfo) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const summary = results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))
    await testInfo.attach('axe-violations.json', { body: JSON.stringify(summary, null, 2), contentType: 'application/json' })
    console.log(`AXE ${route} ${JSON.stringify(summary)}`)
    expect(summary.filter((v) => v.impact === 'critical'), 'critical accessibility violations').toEqual([])
  })
}
