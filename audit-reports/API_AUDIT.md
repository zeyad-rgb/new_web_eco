# API audit

## Endpoint inventory
| Method & path | Auth | Throttle | Tested |
|---|---|---|---|
| GET `/api/v1/products` | public | `catalog` (1200/min) | E2E ✅ |
| POST `/api/v1/orders` | public + CSRF (`web`) | `orders` (10/min/IP) | E2E + run.php ✅ |
| POST `/api/v1/orders/track` | public | `orders` | — |
| POST `/checkout/quote` | public + CSRF | `quote` (120/min) | E2E ✅ |
| GET `/customer/session` | public | `session` | E2E ✅ |
| POST `/customer/register`, `/customer/login` | public + CSRF | `auth` (5/min) | run.php ✅ |
| POST `/staff/login`, `/staff/dispatch-login` | public + CSRF | 5/min | run.php + E2E ✅ |
| GET `/staff/{bundle,catalog,orders,customers,audit,settings,whatsapp-queue,media/limits}` | staff (admin for orders/customers/audit/settings/queue) | default | partly ✅ |
| PUT/POST/DELETE `/staff/...` (orders status, products, publish, settings, categories, product-types, media, whatsapp) | staff + CSRF | upload 120/min | partly ✅ |
| GET `/media/{uuid}` | public if product published; otherwise staff | — | — |

## Findings

### API-01 — Admin-only checks inconsistent across `/staff/*`
See **SEC-01** (High) and **BE-01**.

### API-02 — Inconsistent error language and format
| Severity | Low | Priority | P3 |
|---|---|---|---|
Messages mix Arabic and English (`'Invalid email or password.'` vs `'بيانات الدخول غير صحيحة.'`, `'Invalid order status transition.'`). This enables SEC-04 and confuses users. **Fix.** Use translation keys (`lang/ar`, `lang/en`) and one error envelope `{message, code}`.

### API-03 — No API contract
| Severity | Informational | Priority | P3 |
|---|---|---|---|
There's no OpenAPI document. Adding one would enable contract tests and generated TypeScript types for `frontend/src/types`.

## Untested
- Rate-limit behaviour under Redis, and the 429 responses in the UI.
- `/api/v1/orders/track` and `/media/{id}` access rules have no automated tests yet. Add E2E cases: unpublished media returns 404 to anonymous users.
