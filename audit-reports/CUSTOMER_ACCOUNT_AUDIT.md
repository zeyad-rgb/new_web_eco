# Customer account & `/profile` audit (2026-11-22)

> **Update, same day, branch `fix/customer-page`:** CUST-01, 02, 03, 04, 06 and 07 are fixed, along with a related bug found while verifying (CUST-09). Still open: CUST-05 (password reset needs a mail provider), CUST-08 (contrast, tracked as FE-01), and the hard-coded "1,000 EGP" text on the shipping-policy, product, trust-bar and cart pages (CUST-10). Tests: backend 57/57, E2E 58/58.

Scope: `frontend/src/views/ProfileView.vue`, `LoginView.vue`, `RegisterView.vue`, `stores/auth.ts`, `App.vue`, `router/index.ts`, `backend/app/Http/Controllers/CustomerAuthController.php`, `/api/v1/orders/track`.
Evidence: new `frontend/e2e/customer-account.spec.ts` (7 tests, all green on the disposable E2E stack), Lighthouse mobile on `/profile`, and code reading. Your development database was only read (settings), never written.

## What the page calls, and whether it works
| Feature on `/profile` | Data source | Works? | Evidence |
|---|---|---|---|
| Name, email, mobile | `/customer/session` (via login/register, persisted in `localStorage.ecomars_auth`, revalidated on app start in `App.vue:26`) | ✅ | E2E "shows the signed-in customer and survives a reload" |
| Stale data after the server session ends | `App.vue` clears the user if `/customer/session` returns none | ✅ | E2E "profile does not show stale data…" |
| Register / login / logout APIs | `/customer/register`, `/customer/login`, `/staff/logout` | ✅ | E2E "register → session → logout → login" (case-insensitive email ✅) |
| Registration validation | password ≥ 12, Egyptian mobile regex, staff emails blocked | ✅ | E2E "registration validation" |
| Wrong password | 422, no internal details | ✅ | E2E |
| Track your package | `POST /api/v1/orders/track` | ✅ total correct, phone hidden, name masked, unknown ID → 404 | E2E "tracks the customer's own order" |
| Wishlist count / In bag count | local Pinia stores (this device only) | ✅ device-local only | code |
| Sign out | `POST /staff/logout` (invalidates the whole session) | ✅ | E2E |
| Reward points | `CustomerAuthController::profile()` **hard-codes `points => 0`** | ⚠ placeholder | CUST-03 |
| Tier badge "SILVER" | backend sends `clubTier: 'member'`; the UI maps anything unknown to SILVER | ⚠ placeholder | CUST-03 |
| Membership benefits (free shipping over 800, birthday voucher, early access) | static text in `stores/locale.ts:229-234` | ❌ not implemented | CUST-04 |
| Forgot password | `LoginView.vue:89` shows a toast: "not connected yet" | ❌ missing | CUST-05 (= EC-06) |
| My orders list | no endpoint, although `orders.customer_id` is stored (`ShopController.php:150`) | ❌ missing | CUST-06 |
| Edit profile / change password | none | ❌ missing | CUST-06 |

## Findings

### CUST-01: `/profile` is open to visitors who aren't signed in and shows fake account data ✅ fixed
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `frontend/src/router/index.ts:117-121` (no guard), `ProfileView.vue:93,105,109,113` (fallbacks `'Demo Customer'`, `'user@example.com'`, `'01000000000'`, `points ?? 350`) | Status | Open |
**Impact.** Anyone opening `/profile` sees a made-up member with 350 points and a "Sign out" button. It looks like someone else's account and confuses customers. **Fix.** In `router.beforeEach`, redirect `/profile` to `/login?redirect=/profile` when `auth.user?.role !== 'customer'` (after refreshing the session), and remove the demo fallbacks. **Test.** `customer-account.spec.ts` "anonymous visitor is redirected away from /profile (CUST-01)" is currently marked `test.fail`. Remove that marker when fixed.

### CUST-02: Profile page benefits promise a shipping rule the server doesn't apply ✅ fixed
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `stores/locale.ts:230` ("free shipping over 800 EGP instead of 1,000"), `LoginView` ("free express shipping over 800 EGP"); server `CheckoutPricing.php:21` applies one threshold for everyone (your dev DB: **1,500 EGP**; announcement bar fallback: 4,000 EGP) | Status | Open |
**Impact.** A member ordering 900 EGP expects free shipping and is charged 85 EGP. That causes disputes and erodes trust. Four different thresholds appear in the UI (800, 1,000, 1,500, 4,000). **Fix.** Render the threshold from `shippingSettings.free_threshold` everywhere and remove the member-only claim (or implement it in `CheckoutPricing` for logged-in customers). **Test.** E2E: the text on the profile and login pages shows the same number the `/checkout/quote` API uses.

### CUST-03: Points and tier are placeholders ✅ fixed
| Severity | Low | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
`points` is always 0 and the tier is always SILVER, yet the page says "Earn 10 points for every 100 EGP". **Fix.** Hide the club card until loyalty exists, or compute points from the customer's delivered orders.

### CUST-04: Birthday voucher and early access are advertised but not implemented ✅ fixed
| Severity | Low | Priority | P2 |
|---|---|---|---|
There's no birthday field and no early-access logic. Remove the claims until the features exist (consumer-protection risk).

### CUST-05: No password reset
| Severity | **Medium** for a live store | Priority | P1 |
|---|---|---|---|
"Forgot password?" only shows a toast. A customer who forgets their password is locked out, and re-registering is blocked because the email already exists. **Fix.** Laravel's password broker (`Password::sendResetLink`) with a mail driver, a reset token table, and throttling.

### CUST-06: Customers can't see their orders or edit their profile ✅ fixed
| Severity | Low | Priority | P2 |
|---|---|---|---|
Orders already record `customer_id`. Add `GET /customer/orders` (session-scoped, paginated, masked) and a "My orders" list on `/profile` so customers don't need to paste UUIDs into the tracker. **Security test.** Customer A must never see customer B's orders (IDOR).

### CUST-07: "Member since" shows a raw database timestamp ✅ fixed
| Severity | Informational | Location | `ProfileView.vue:89` (`2026-11-22 04:39:43`) |
|---|---|---|---|
Format it with `Intl.DateTimeFormat(locale)` (e.g. "نوفمبر ٢٠٢٦").

### CUST-08: Accessibility on `/profile` (Lighthouse mobile: Accessibility 95, Best Practices 100, SEO 100)
Failing audits: contrast on `.visit-link` and `.language-button` (announcement bar) and on `.logout-btn`, and the logo `aria-label="Studio Active home"`, which doesn't contain the visible text "Studio Active". These are the same root causes as **FE-01**. Also consider `<meta name="robots" content="noindex">` for `/profile`, `/login`, `/register`.

### CUST-09: First visit showed hard-coded store settings ✅ fixed
| Severity | **Medium** | Confidence | Verified | Location | `frontend/src/stores/catalog.ts` `load()` |
|---|---|---|---|---|---|
`load()` stored products but never copied `shippingSettings`, `storefrontSettings` or `whatsappSettings` from the API response. Those were only read from the session cache on the next full load, so a new visitor saw the defaults: "Free shipping over 4000 EGP", an 800 EGP threshold, and the WhatsApp number `01000000000`. Fixed by assigning them in `load()`, and the defaults no longer promise anything (threshold 0 hides the line and the cart meter). Verified in a fresh browser context against the dev server: the bar and login page show 1,500 EGP.

### CUST-10: Other pages still hard-code "1,000 EGP"
| Severity | Low | Priority | P2 | Status | Open |
|---|---|---|---|---|---|
`ShippingPolicyView.vue:43,81,104`, `TrustBar.vue:16`, `stores/locale.ts` (`announcement.shipping`, `cart.feature_free_shipping_sub`, `pdp.free_shipping_notice`) and the `CartView.vue:16` comment. Replace them with `useFreeShippingText()` from `frontend/src/utils/shipping.ts`.

## How the fixes were made
| ID | Change | Test |
|---|---|---|
| CUST-01 | `router/index.ts`: the `/profile` guard re-validates `/customer/session` and sends staff to `/admin`, anyone else to `/login?redirect=/profile`. Demo fallbacks removed from `ProfileView.vue`. | E2E "anonymous visitor is redirected…" (no longer `test.fail`), "shows the signed-in customer…" (no localStorage seeding) |
| CUST-02/03/04 | Points, tier, birthday and early-access claims removed from profile, login, register, mobile menu, account hub and translations. Free-shipping text now comes from the store setting via `utils/shipping.ts`. | E2E "shows no placeholder or unfulfilled promises" scans `/profile`, `/login`, `/register` |
| CUST-06 | `GET /customer/orders` (`CustomerAuthController::orders`): session-scoped, newest 20, no contact details, 401 when signed out. "My orders" list on `/profile` with a Track button. | `run.php`: 401 anonymous, A sees own order, no PII, B sees none (IDOR). E2E "lists the customer's own orders…" |
| CUST-07 | "Member since" formatted with `Intl.DateTimeFormat` (e.g. "نوفمبر ٢٠٢٦") | visual |
