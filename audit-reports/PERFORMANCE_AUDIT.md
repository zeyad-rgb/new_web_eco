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

### PERF-02: Mobile LCP is poor on the home page (6.3 s)
| Severity | **Medium** | Confidence | Verified (lab) | Priority | P1 |
|---|---|---|---|---|---|

Measured 2026-11-22 with Chrome DevTools MCP traces on a **production build** (`vite preview`, API from the local dev backend). The mobile profile uses a 412×915 viewport, Slow 4G and 4× CPU slowdown. Lab data only; there's no real-user (CrUX) data yet.

| Page | Desktop LCP | Mobile LCP | Rating (mobile) | CLS | Main cause (mobile) |
|---|---|---|---|---|---|
| `/` | 833 ms | **6,337 ms** | 🔴 poor (> 4 s) | 0.00 | hero image found late (2.4 s load delay) + 2.8 s download |
| `/shop` | — | 3,631 ms | 🟡 needs improvement | 0.00 | first product image found only after JS + catalog API (2.2 s delay) |
| `/product/training-tee` | — | 3,942 ms | 🟡 needs improvement | 0.00 | 1.7 s load delay + 1.1 s render delay (JS + catalog fetch) |
| `/profile` (Lighthouse) | — | — | A11y 95 · Best practices 100 · SEO 100 | — | see CUST-08 |

TTFB was 564 ms under Slow 4G (that's the throttle's latency, not the server). CLS is 0 everywhere ✅.

**Root causes and fixes, highest impact first:**
1. **The LCP image isn't in the HTML.** `HomeView.vue:22` renders `/campaign/sculptural-sportswear.webp` only after the JS bundle runs. Add `<link rel="preload" as="image" href="/campaign/sculptural-sportswear.webp" fetchpriority="high">` to `index.html`, which removes most of the 2.4 s load delay.
2. **Images are larger than they're displayed** (DevTools ImageDelivery: 248 kB wasted on `/`). The hero is 861×1024 displayed at 919×613 and could be compressed further (−108 kB). `reference/men.jpg` and `women.jpg` are 800×920 displayed at 239×298 (−96 kB). Uploaded product media is 902×1200 shown at 409×307 (−43 kB). **Fix.** Generate 480/960 px WebP variants and use `srcset`/`sizes`. The upload pipeline (`ProductEditorController`) could save a thumbnail size too.
3. **Render-blocking Google Fonts CSS (87 kB of fonts, 2 families × 9 weights).** That costs about 550 ms of FCP. Self-host only the used weights (or cut to 3 weights each) and preload the Arabic font.
4. **The shop and product pages wait for the catalog API before showing anything.** Consider inlining the first page of products into the HTML at build or deploy time, or render a skeleton with fixed image boxes so the image request starts earlier.

### PERF-04: nginx has no compression
| Severity | **Medium** | Confidence | Verified (config) | Priority | P1 |
|---|---|---|---|---|---|
| Location | `deploy/nginx.conf` (no `gzip` directives; the `nginx:alpine` default leaves gzip off) | Status | Open |
The 176 kB main JS bundle would be sent as 176 kB instead of 65 kB gzipped, and the CSS and catalog JSON (10 kB) uncompressed too. On mobile that adds roughly 1 s. **Fix.** `gzip on; gzip_types text/css application/javascript application/json image/svg+xml; gzip_min_length 1024;`, or pre-compress at build time with `gzip_static on`.

### PERF-05: The catalog API is also limited by the general API throttle
| Severity | Low | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
`GET /api/v1/products` returns `X-RateLimit-Limit: 120`. `bootstrap/app.php` applies `throttleApi()` (120/min/IP) to every `/api` route in addition to the dedicated `throttle:catalog` (1200/min). Shoppers behind one carrier-NAT IP share 120 catalog loads per minute. **Fix.** Exclude the catalog route from the global API throttle or raise the `api` limiter. Catalog responses already send `Cache-Control: max-age=30, stale-while-revalidate=60` and an ETag ✅.

### PERF-03 — No production-like load test
| Severity | Informational | Confidence | Untested | Priority | P2 |
|---|---|---|---|---|---|
Run `tools/audit/k6-smoke.js` (and, with approval, `perf/catalog.js`) against the compose stack (php-fpm + nginx + Redis) on localhost, not against `php -S`. That needs Docker Desktop running.
