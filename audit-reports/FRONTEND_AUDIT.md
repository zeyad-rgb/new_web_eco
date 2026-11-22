# Frontend audit (Vue 3 + TypeScript + Vite)

Evidence: Playwright, 49 tests, **49 expected results** (48 passed + 1 expected failure, SEC-03), 84 s. These covered 14 routes on desktop and Pixel 7 with no console errors, no failed or 5xx requests, and no horizontal scroll. They also covered axe-core WCAG 2.1 AA on 6 routes, and `vue-tsc` + `vite build` passed.

## Accessibility (axe-core)
| Route | color-contrast (serious) | label-content-name-mismatch (serious) | critical |
|---|---|---|---|
| `/` | 3 nodes | 2 | 0 |
| `/shop` | 6 | 1 | 0 |
| `/product/training-tee` | 9 | 1 | 0 |
| `/cart` | 3 | 1 | 0 |
| `/checkout` | 3 | 1 | 0 |
| `/login` | 4 | 1 | 0 |

### FE-01 — Insufficient color contrast and accessible-name mismatches on every page
| Severity | **Medium** | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
| Location | shared components (header/footer/trust bar appear on every route; exact nodes in `audit-reports/raw/playwright-artifacts/*/axe-violations.json` and in the HTML report) | Status | Open |
The mismatch seen on every route probably comes from one shared control, likely in the header, whose `aria-label` doesn't contain its visible text. **Fix.** Raise text contrast to at least 4.5:1, and make each `aria-label` start with the visible label. **Test.** Tighten `accessibility.spec.ts` to fail on `serious` too, once fixed.

### FE-02 — Payment options shown that the backend doesn't support
See **EC-01** (Medium).

### FE-03 — `v-html` usage
| Severity | Informational | Location | `frontend/src/InfoPage.vue:15` |
|---|---|---|---|
This renders a static, developer-authored title map, so there's no XSS today. Keep it that way, or switch to text interpolation.

## Responsive and SEO
- All 14 routes fit 375 px (Pixel 7) with no horizontal overflow ✅.
- `index.html` has a `<title>` and meta description. There are no per-route titles or descriptions, no canonical tags, and no product structured data. **FE-04 (Low, P3).** Add per-route `document.title` and meta tags in the router `afterEach`, plus `Product` JSON-LD on the product page.
- History-mode router plus the nginx `try_files … /index.html` fallback gives crawlable URLs ✅.

## Untested
- Staff UI (`/admin` screens) has no browser tests yet. Only its API was tested.
- Keyboard-only navigation and screen-reader announcements need manual checks.
