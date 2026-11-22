import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// ── CUSTOM INSTRUMENTATION & OBSERVABILITY ────────────────────────────────────
export const successfulReqs    = new Counter('successful_reqs');
export const failedReqs        = new Counter('failed_reqs');
export const transportErrors   = new Counter('transport_errors');
export const http429Throttled  = new Counter('http_429_throttled');
export const http5xxErrors     = new Counter('http_5xx_server_errors');
export const http4xxErrors     = new Counter('http_4xx_client_errors');

export const catalogLatency    = new Trend('catalog_latency', true);
export const sessionLatency    = new Trend('session_latency', true);
export const quoteLatency      = new Trend('quote_latency', true);
export const etag304Success    = new Rate('etag_304_rate');

// ── TARGET & ENVIRONMENT SAFETY CHECKS ─────────────────────────────────────────
const TARGET_URL = (__ENV.TARGET_URL || 'http://127.0.0.1:8008').replace(/\/+$/, '');
const BENCHMARK_TOKEN = __ENV.BENCHMARK_TOKEN || '';
const IS_PROD_URL = /(studioactive\.com|ecomars\.eg|production)/i.test(TARGET_URL);
const ALLOW_PROD = __ENV.ALLOW_PRODUCTION === 'true';

if (IS_PROD_URL && !ALLOW_PROD) {
  throw new Error(`[SAFETY GUARDRAIL] Execution aborted. Target URL "${TARGET_URL}" appears to be a production environment. Set ALLOW_PRODUCTION=true to override.`);
}

// ── EXECUTOR SELECTION (Arrival Rate vs Iteration) ─────────────────────────────
// Supports explicit arrival-rate testing to measure true req/sec capacity.
const MODE = __ENV.MODE || 'smoke';

const SCENARIOS = {
  // Fast Smoke Test: 1 VU, 5 iterations
  smoke: {
    executor: 'shared-iterations',
    vus: 1,
    iterations: 5,
    maxDuration: '30s',
  },
  // Low Concurrency Test: 2 VUs, 20 iterations
  low: {
    executor: 'shared-iterations',
    vus: 2,
    iterations: 20,
    maxDuration: '1m',
  },
  // Arrival Rate Test: Explicit target requests-per-second (RPS)
  // Ramp from 10 req/s -> 50 req/s -> 167 req/s
  arrival_rate: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 20,
    maxVUs: 150,
    stages: [
      { target: 20, duration: '15s' },
      { target: 50, duration: '30s' },
      { target: 167, duration: '1m' }, // Target 166.7 req/sec = 600,000 req/hour
      { target: 0, duration: '15s' },
    ],
  },
};

export const options = {
  scenarios: {
    default_scenario: SCENARIOS[MODE] || SCENARIOS.smoke,
  },
  thresholds: {
    // Safety Stop: Abort if failure rate exceeds 5% after the first 10 seconds
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '10s' }],
    // Latency target: Configurable (default 800ms for local single-process dev, 300ms for Staging/Production)
    'http_req_duration{expected_response:true}': [`p(95)<${__ENV.P95_LIMIT || (MODE === 'smoke' ? '900' : '300')}`],
  },
};

// Per-VU state (simulates browser HTTP cache & CSRF session across iterations)
let vuLastEtag = '';
let vuCsrfToken = '';

// ── SAFE RESPONSE PARSER HELPER ──────────────────────────────────────────────
function safeParseJson(res) {
  if (!res || !res.body) return null;
  try {
    return JSON.parse(res.body);
  } catch (_) {
    return null;
  }
}

// ── BASE HEADERS HELPER ───────────────────────────────────────────────────────
function getHeaders(extra = {}) {
  const h = {
    'Accept': 'application/json',
    ...extra,
  };
  if (BENCHMARK_TOKEN) {
    h['X-Benchmark-Token'] = BENCHMARK_TOKEN;
  }
  return h;
}

// ── RECORD RESPONSE METRICS ───────────────────────────────────────────────────
function recordMetrics(res, latencyTrend) {
  if (!res) {
    transportErrors.add(1);
    failedReqs.add(1);
    return false;
  }

  const status = res.status;
  latencyTrend.add(res.timings.duration);

  if (status >= 200 && status < 400) {
    successfulReqs.add(1);
    return true;
  }

  failedReqs.add(1);
  if (status === 429) {
    http429Throttled.add(1);
  } else if (status >= 500) {
    http5xxErrors.add(1);
  } else if (status >= 400) {
    http4xxErrors.add(1);
  } else {
    // status === 0 (network transport drop or connection reset)
    transportErrors.add(1);
  }
  return false;
}

// ── MAIN TEST ITERATION ───────────────────────────────────────────────────────
export default function () {
  // Traffic weighting (production user distribution):
  //   - 85% Catalog browsing & conditional 304 revalidations
  //   - 10% User Session / Auth status check
  //   -  5% Checkout quote calculations
  const roll = Math.random();

  if (roll < 0.85) {
    // ── 85% CATALOG TRAFFIC ───────────────────────────────────────────────────
    const headers = getHeaders();
    const hasEtag = Boolean(vuLastEtag);

    // If VU has cached ETag from previous turn, send conditional revalidation
    if (hasEtag && Math.random() < 0.70) {
      headers['If-None-Match'] = vuLastEtag;
    }

    let res = null;
    try {
      res = http.get(`${TARGET_URL}/api/v1/products`, { headers, timeout: '10s' });
    } catch (_) {
      // Handled in recordMetrics
    }

    const isOk = recordMetrics(res, catalogLatency);

    if (res && res.status === 304) {
      etag304Success.add(1);
      check(res, { 'revalidation is 304': (r) => r.status === 304 });
    } else if (isOk && res.status === 200) {
      const etag = res.headers['Etag'] || res.headers['ETag'];
      if (etag) vuLastEtag = etag;

      const data = safeParseJson(res);
      check(res, {
        'catalog status is 200': (r) => r.status === 200,
        'catalog returns products array': () => Array.isArray(data?.products),
      });
    } else {
      check(res, { 'catalog request succeeded': () => isOk });
    }

  } else if (roll < 0.95) {
    // ── 10% CUSTOMER SESSION TRAFFIC ──────────────────────────────────────────
    let res = null;
    try {
      res = http.get(`${TARGET_URL}/customer/session`, {
        headers: getHeaders(),
        timeout: '10s',
      });
    } catch (_) {
      // Handled in recordMetrics
    }

    const isOk = recordMetrics(res, sessionLatency);
    if (isOk) {
      const data = safeParseJson(res);
      if (data?.csrf) vuCsrfToken = data.csrf;
      check(res, {
        'session status is 200': (r) => r.status === 200,
        'session contains csrf token': () => typeof data?.csrf === 'string',
      });
    } else {
      check(res, { 'session request succeeded': () => isOk });
    }

  } else {
    // ── 5% CHECKOUT QUOTE TRAFFIC ─────────────────────────────────────────────
    // If VU does not have a CSRF token yet, obtain one first
    if (!vuCsrfToken) {
      try {
        const sRes = http.get(`${TARGET_URL}/customer/session`, { headers: getHeaders(), timeout: '5s' });
        const sData = safeParseJson(sRes);
        if (sData?.csrf) vuCsrfToken = sData.csrf;
      } catch (_) {}
    }

    const payload = JSON.stringify({
      items: [{ sku: 'training-tee-0-M', quantity: 1 }],
      discount_code: '',
    });

    const quoteHeaders = getHeaders({ 'Content-Type': 'application/json' });
    if (vuCsrfToken) {
      quoteHeaders['X-CSRF-TOKEN'] = vuCsrfToken;
    }

    let res = null;
    try {
      res = http.post(`${TARGET_URL}/checkout/quote`, payload, {
        headers: quoteHeaders,
        timeout: '10s',
      });
    } catch (_) {
      // Handled in recordMetrics
    }

    const isOk = recordMetrics(res, quoteLatency);
    if (isOk) {
      const data = safeParseJson(res);
      check(res, {
        'quote status is 200 or 422': (r) => r.status === 200 || r.status === 422,
        'quote returns valid pricing object': () => data !== null && (data.total !== undefined || data.message !== undefined),
      });
    } else {
      check(res, { 'quote request succeeded': () => isOk });
    }
  }

  // Inter-request pacing in non-arrival-rate modes
  if (MODE !== 'arrival_rate') {
    sleep(0.05 + Math.random() * 0.1);
  }
}

// ── CUSTOM TERMINAL SUMMARY REPORT ────────────────────────────────────────────
export function handleSummary(data) {
  const reqTotal = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const reqRate  = data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(1) : 0;
  const succ     = data.metrics.successful_reqs ? data.metrics.successful_reqs.values.count : 0;
  const fail     = data.metrics.failed_reqs ? data.metrics.failed_reqs.values.count : 0;
  const drops    = data.metrics.transport_errors ? data.metrics.transport_errors.values.count : 0;
  const throttled = data.metrics.http_429_throttled ? data.metrics.http_429_throttled.values.count : 0;
  const p95      = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 'N/A';
  const p99      = data.metrics.http_req_duration ? (data.metrics.http_req_duration.values['p(99)'] || 0).toFixed(2) : 'N/A';
  const med      = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.med.toFixed(2) : 'N/A';

  const out = `
========================================================================
             STAGING CAPACITY BENCHMARK SUMMARY REPORT
========================================================================
 Target URL:                 ${TARGET_URL}
 Execution Mode:             ${MODE}
 Total Requests Attempted:   ${reqTotal}
 Observed Throughput:        ${reqRate} requests/second
 Successful Requests:        ${succ}
 Failed Requests:            ${fail}
   • Throttled (HTTP 429):   ${throttled}
   • Transport / Drops:      ${drops}
 Latency Median:             ${med} ms
 Latency p(95):              ${p95} ms
 Latency p(99):              ${p99} ms
========================================================================
`;
  return {
    stdout: out,
  };
}
