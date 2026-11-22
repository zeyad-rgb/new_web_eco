---
name: frontend-audit
description: Audit the Vue 3 + TypeScript storefront and staff UI - responsive layout, accessibility (axe/WCAG 2.1 AA, RTL Arabic), SEO (meta, robots, hash vs history routing), console/network errors, and UX correctness of checkout. Use for frontend audits or UI changes.
---

# Frontend audit

## Evidence
- `audit-reports/raw/playwright-results.json` and `e2e-playwright.log`: storefront.spec (route smoke, console/network errors, mobile no-horizontal-scroll), accessibility.spec (axe per route; `AXE <route> [...]` lines in the log).
- `frontend-typecheck-build.log`: `vue-tsc` + Vite bundle sizes.

## Live inspection
Prefer the Playwright MCP or Chrome DevTools MCP (plugins). Start a local stack first; never inspect production with active tooling. For performance traces use the `web-perf` skill.

## Checks
1. Responsive: 375px, 768px, 1280px — no horizontal scroll, tap targets ≥ 44px, sticky elements don't cover CTAs.
2. Accessibility: axe serious/critical, color contrast, accessible names, focus order, `lang="ar" dir="rtl"`, form labels and errors announced.
3. SEO: `<title>`/description per route, `robots.txt`, canonical, product structured data; whether the router mode allows indexing.
4. Correctness: payment options shown vs. submitted; demo mode (`StudioActive-preview.html`) never reachable from production build; error states for 409/422/429.
5. Security in UI: no `v-html` with user/staff data; CSRF header on every non-GET (`frontend/src/api/staff.ts`).

Output: issues with `FE-` IDs.
