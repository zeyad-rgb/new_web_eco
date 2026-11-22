# Customer account & `/profile` audit (2026-11-22)

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

### CUST-01: `/profile` is open to visitors who aren't signed in and shows fake account data
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `frontend/src/router/index.ts:117-121` (no guard), `ProfileView.vue:93,105,109,113` (fallbacks `'Demo Customer'`, `'user@example.com'`, `'01000000000'`, `points ?? 350`) | Status | Open |
**Impact.** Anyone opening `/profile` sees a made-up member with 350 points and a "Sign out" button. It looks like someone else's account and confuses customers. **Fix.** In `router.beforeEach`, redirect `/profile` to `/login?redirect=/profile` when `auth.user?.role !== 'customer'` (after refreshing the session), and remove the demo fallbacks. **Test.** `customer-account.spec.ts` "anonymous visitor is redirected away from /profile (CUST-01)" is currently marked `test.fail`. Remove that marker when fixed.

### CUST-02: Profile page benefits promise a shipping rule the server doesn't apply
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `stores/locale.ts:230` ("free shipping over 800 EGP instead of 1,000"), `LoginView` ("free express shipping over 800 EGP"); server `CheckoutPricing.php:21` applies one threshold for everyone (your dev DB: **1,500 EGP**; announcement bar fallback: 4,000 EGP) | Status | Open |
**Impact.** A member ordering 900 EGP expects free shipping and is charged 85 EGP. That causes disputes and erodes trust. Four different thresholds appear in the UI (800, 1,000, 1,500, 4,000). **Fix.** Render the threshold from `shippingSettings.free_threshold` everywhere and remove the member-only claim (or implement it in `CheckoutPricing` for logged-in customers). **Test.** E2E: the text on the profile and login pages shows the same number the `/checkout/quote` API uses.

### CUST-03: Points and tier are placeholders
| Severity | Low | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
`points` is always 0 and the tier is always SILVER, yet the page says "Earn 10 points for every 100 EGP". **Fix.** Hide the club card until loyalty exists, or compute points from the customer's delivered orders.

### CUST-04: Birthday voucher and early access are advertised but not implemented
| Severity | Low | Priority | P2 |
|---|---|---|---|
There's no birthday field and no early-access logic. Remove the claims until the features exist (consumer-protection risk).

### CUST-05: No password reset
| Severity | **Medium** for a live store | Priority | P1 |
|---|---|---|---|
"Forgot password?" only shows a toast. A customer who forgets their password is locked out, and re-registering is blocked because the email already exists. **Fix.** Laravel's password broker (`Password::sendResetLink`) with a mail driver, a reset token table, and throttling.

### CUST-06: Customers can't see their orders or edit their profile
| Severity | Low | Priority | P2 |
|---|---|---|---|
Orders already record `customer_id`. Add `GET /customer/orders` (session-scoped, paginated, masked) and a "My orders" list on `/profile` so customers don't need to paste UUIDs into the tracker. **Security test.** Customer A must never see customer B's orders (IDOR).

### CUST-07: "Member since" shows a raw database timestamp
| Severity | Informational | Location | `ProfileView.vue:89` (`2026-11-22 04:39:43`) |
|---|---|---|---|
Format it with `Intl.DateTimeFormat(locale)` (e.g. "نوفمبر ٢٠٢٦").

### CUST-08: Accessibility on `/profile` (Lighthouse mobile: Accessibility 95, Best Practices 100, SEO 100)
Failing audits: contrast on `.visit-link` and `.language-button` (announcement bar) and on `.logout-btn`, and the logo `aria-label="Studio Active home"`, which doesn't contain the visible text "Studio Active". These are the same root causes as **FE-01**. Also consider `<meta name="robots" content="noindex">` for `/profile`, `/login`, `/register`.
