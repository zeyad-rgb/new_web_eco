---
name: performance-audit
description: Measure and improve Studio Active performance - Core Web Vitals and Lighthouse via Chrome DevTools MCP (web-perf skill), bundle and image weight, API latency, cache behaviour, and low-volume k6 load tests against local environments. Use for performance audits, slow pages, or load testing.
---

# Performance audit

## Frontend
Use the `web-perf` skill (vendored from cloudflare/skills) with the Chrome DevTools MCP against a **production build** served locally (`npm run build` then `npx vite preview`), not the dev server. Record LCP, CLS, INP/TBT, TTFB with the rating thresholds in that skill.
Quick checks from the repo: image weight in `frontend/public/campaign` and `reference` (PNG > 1 MB is a finding if WebP exists), bundle sizes in `frontend-typecheck-build.log`.

## Backend
- `tools/audit/k6-smoke.js` — 5 VUs/30s, refuses non-local targets. `K6_BASE_URL=http://127.0.0.1:8009 k6 run tools/audit/k6-smoke.js`.
- Existing heavier scripts: `backend/load-test.js`, `perf/catalog.js` — read their options before running; only run against local stacks; ask the user before anything above smoke volume.
- `backend/tests/latency_breakdown.php`, `verify_cache.php` for cache hit/miss behaviour.

## Rules
Quantify every recommendation (bytes, ms). A metric already rated "good" is not a finding. Never load-test staging/production without explicit approval.

Output: issues with `PERF-` IDs.
