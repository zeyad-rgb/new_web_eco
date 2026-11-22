# Admin panel, home and product pages — audit (2026-11-22)

Scope: `frontend/src/Admin.vue` (2,745 lines, 7 sections), `ProductEditor.vue`, the `/staff/*` API in `backend/routes/web.php`, `ProductEditorController`, plus `HomeView.vue`, `ShopView.vue` and `ProductDetailView.vue`.
Evidence: new `frontend/e2e/admin.spec.ts` (13 tests) and `catalog-pages.spec.ts` (6 tests), 10 new checks in `backend/tests/run.php`, and code review. Branch `feat/admin-and-catalog`. Your development database was not modified.

## Fixed in this pass
| ID | Severity | Problem | Fix |
|---|---|---|---|
| ADM-01 | **High** | Opening `/admin/settings` directly showed hard-coded defaults (fake codes `WELCOME10`/`STUDIO20`, demo WhatsApp number `01000000000`, "4000 EGP" banner). Pressing Save wrote those over the real settings. | The section loads on mount; Save is disabled until the server values arrive and refuses otherwise. Fake defaults removed. |
| ADM-02 | Medium | A `catalog_manager` saw Orders and Customers in the menu (both 403), and the role defaulted to `admin` before the session resolved, flashing admin-only items. | Menu and money KPIs are gated on the real role, which starts empty. |
| ADM-03 | Medium | Deleting a product hard-deleted its variants, so past orders of it could no longer be cancelled or returned (stock restore needs the SKU). | 409 with "convert it to a draft" when the product has sales history. |
| ADM-04 | Medium | Order search and the status filter ran only over the 50 orders on the current page, so staff could not find older orders. | Both run on the server (`?status=`, `?q=` by id prefix) with `X-Total-Count`; pagination moved into the section and shows "page x of y". |
| ADM-05 | Medium | The status dropdown offered every status, including transitions the backend rejects with 409 (e.g. cancelled → shipped). | Only transitions `OrderLifecycle` allows, with a confirmation before cancel/return because they restock. |
| ADM-06 | Medium | Staff could not set the storefront badge, the fit, or collection membership, although the shop filters and searches on all three. | Added to the editor sidebar; `/staff/catalog` and `/staff/bundle` now return collections and memberships. |
| ADM-07 | Medium | Removing a colour or size from a product silently deleted sold SKUs (same consequence as ADM-03). | 409: "set the quantity to zero instead of deleting it". |
| ADM-08 | **High** | `/api/v1/products` was sent with `Cache-Control: max-age=30`, so after a staff edit the storefront kept serving the old catalog from the browser cache for up to 30 s even though the server cache is busted on save. | `max-age=0, must-revalidate`; the existing ETag keeps revalidation cheap (304). The session paint cache also expires after 10 minutes. |
| HOME-01 | Medium | The four "shop by collection" tiles were hard-coded. `t-shirts` is a product **type**, not a category, so that tile always landed on an empty shop page; `women` is empty in the demo catalog. A test proved all four were empty. | Tiles are built from the real taxonomy and only shown when the branch has published products. |
| HOME-02 | Low | "New arrivals" was `products.slice(0, 4)` — the first four by id, never actually the newest. | Products in the `latest` collection come first, which staff control from the editor. |
| PDP-01 | Medium | An unknown product id rendered the loading skeleton forever, with no error. | A not-found message with a link back to the shop. |
| PDP-02 | Low | Every product page kept the router's generic title, so all products shared one title and description in search results and link previews. | Title and meta description are set from the product. |

## Still open
### ADM-09: `Admin.vue` is a single 2,745-line component
| Severity | Medium | Priority | P2 |
|---|---|---|---|
Seven sections, all data loading, and every form live in one file, which is how ADM-01 and ADM-02 happened. Split into `views/admin/{Dashboard,Products,Orders,Customers,Categories,Settings,Audit}.vue` with a shared layout and a small `useStaffApi` composable, and move the sections to child routes.

### ADM-10: Order list decrypts every order to search it
| Severity | Low | Priority | P2 | Location | `backend/routes/web.php` `/staff/orders` |
|---|---|---|---|---|---|
Customer name and phone are encrypted, so staff can only search by order id. Searching by phone would need a blind index (HMAC of the phone stored in a column), which keeps the data encrypted while making lookups possible.

### ADM-11: No bulk actions
| Severity | Low | Priority | P3 |
|---|---|---|---|
Publishing, unpublishing or restocking several products means one request each. Worth adding once ADM-09 is done.

### ADM-12: WhatsApp messages are built in the browser
| Severity | Low | Priority | P3 | Location | `Admin.vue` `getWhatsAppOrderUrl` |
|---|---|---|---|---|---|
The order confirmation text exists twice: in `WhatsAppService` (server) and in `Admin.vue`. They can drift. The client copy also hard-codes "24-48 hours" while the delivery estimate is a store setting. Use the server-built link (`admin_send_url`) everywhere.

### SHOP-01: Filters are applied in the browser over the whole catalog
| Severity | Medium (at scale) | Priority | P2 | Location | `ShopView.vue` `visible` |
|---|---|---|---|---|---|
`/api/v1/products` returns every published product with all variants (10 KB for 3 products), and the shop filters in JavaScript. At a few hundred products this becomes a slow first paint on mobile. Move filtering, sorting and pagination to the API.

### PDP-03: Reviews and the fit bar are presentational ✅ fixed
| Severity | Low | Priority | P3 | Location | `components/product/ProductReviews.vue` (620 lines) |
|---|---|---|---|---|---|
Ratings and review counts are not backed by any table or endpoint, so the stars shown to customers are not real. Either build reviews (table, moderation, verified-purchase flag) or remove the section before launch — same class of issue as the membership perks in CUST-02.

### PDP-04: Shipping and care text is hard-coded in the page ✅ fixed
| Severity | Low | Priority | P3 |
|---|---|---|---|
The "shipping" accordion repeats delivery times that are a store setting, so an admin change does not reach it (same root cause as CUST-10).

## Test coverage added
| File | Tests | Covers |
|---|---|---|
| `backend/tests/run.php` | +10 checks (74 total) | sold-product delete 409, server order filters + total header, collections/badge/fit persistence, storefront sees collection changes, sold-variant removal 409 |
| `frontend/e2e/admin.spec.ts` | 13 | every section loads clean for an admin, saved settings are not replaced by defaults, allowed-transition menu, status filter hits the server, restock panel, delete refusal, admin edit → shop card, catalog-manager menu has no 403 links |
| `frontend/e2e/catalog-pages.spec.ts` | 6 | every home tile lands on a non-empty page, one h1, eager hero, new arrivals renders, unknown product shows not-found, out-of-stock sizes disabled |

## Resolution (2026-11-23)
| ID | Fix | Test |
|---|---|---|
| EC-01 | `/api/v1/products` now returns `paymentMethods`; checkout only offers a method the order API accepts, driven by the admin toggles rather than the build mode. | run.php "catalog exposes accepted payment methods" |
| EC-02 | `inventory_movements.order_id` is nullable with a new `actor_email`; a staff stock edit writes one `adjustment` row per changed variant, so stock reconciles against sales. The delete/variant guards count only `sale`/`restore`, not adjustments. | run.php "stock adjustment recorded in ledger", "unchanged sizes create no ledger rows" |
| EC-03 | Every product save writes `product.updated` (or `product.created`) to `audit_events` with the old and new price and the net stock change. | run.php "audit records the price change", "audit records the net stock change" |
| PDP-03 | `ProductReviews.vue` (620 lines of invented ratings, review counts and fit bars) removed from the product page and deleted. | catalog-pages "shows no invented ratings…" |
| PDP-04 / CUST-10 | Delivery estimate, cart meter and trust bar read the store's shipping setting; the hard-coded 1,000 EGP figures are gone. | same test asserts no stale figure appears |
