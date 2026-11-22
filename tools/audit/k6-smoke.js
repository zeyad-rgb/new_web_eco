// Low-volume k6 smoke test (5 virtual users, 30s) against a LOCAL stack only.
// Default target is the E2E/dev backend; override with K6_BASE_URL.
// Never point this at production: rate limits will trip and it is not authorized.
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.K6_BASE_URL || 'http://127.0.0.1:8009'
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
  throw new Error(`k6 smoke refuses non-local target: ${BASE}`)
}

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:catalog}': ['p(95)<500'],
    'http_req_duration{name:health}': ['p(95)<200'],
  },
}

export default function () {
  const health = http.get(`${BASE}/up`, { tags: { name: 'health' } })
  check(health, { 'health 200': (r) => r.status === 200 })
  const catalog = http.get(`${BASE}/api/v1/products`, { headers: { Accept: 'application/json' }, tags: { name: 'catalog' } })
  check(catalog, { 'catalog 200': (r) => r.status === 200 })
  sleep(1)
}
