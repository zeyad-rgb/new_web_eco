# Performance audit

## Measured
| Measurement | Value | Source |
|---|---|---|
| Main JS bundle | 176.5 kB (65.2 kB gzip) | `frontend-typecheck-build.log` |
| Largest route chunk | AdminView 60.4 kB (18.7 kB gzip) | same |
| Route-level code splitting | yes (one chunk per view) | same |
| Hero image | WebP 200 kB with `fetchpriority="high"` | `HomeView.vue:22` |
| k6 smoke, 5 VUs × 30 s against the dev PHP built-in server on :8009 | 62 requests, 0 % failed; catalog p95 **3.16 s**; `/up` p95 **6.37 s** | `k6-summary.json` |

The k6 numbers are **not representative of production**. `php -S` (`backend/serve.ps1`) handles one request at a time, so 5 concurrent users queue behind each other. They show the dev server is unsuitable for load testing. They don't show a real bottleneck.

## Findings

### PERF-01 — 4.8 MB of unused PNGs shipped in the build and image
| Severity | Low | Confidence | Verified | Priority | P3 |
|---|---|---|---|---|---|
| Location | `frontend/public/campaign/sculptural-sportswear.png` (2.47 MB), `cairo-dawn.png` (2.30 MB) | Status | Open |
The code references only the `.webp` versions (`grep` finds no `.png` references), but Vite copies `public/` into `dist/` and the nginx image. **Fix.** Delete the PNGs or move them out of `public/`. That saves 4.8 MB of image size and is no risk to users.

### PERF-02 — Core Web Vitals not yet measured
| Severity | Informational | Confidence | Untested | Priority | P2 |
|---|---|---|---|---|---|
The Chrome DevTools MCP and the `web-perf` skill are installed but load only after a Claude Code restart. **Next run.** `npm run build && npx vite preview`, then the `web-perf` skill: trace `/`, `/shop` and `/product/training-tee`, and record LCP, CLS, INP/TBT and TTFB.

### PERF-03 — No production-like load test
| Severity | Informational | Confidence | Untested | Priority | P2 |
|---|---|---|---|---|---|
Run `tools/audit/k6-smoke.js` (and, with approval, `perf/catalog.js`) against the compose stack (php-fpm + nginx + Redis) on localhost, not against `php -S`. That needs Docker Desktop running.
