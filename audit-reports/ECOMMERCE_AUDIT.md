# E-commerce business-logic audit

Payment model: **cash on delivery only**. No payment gateway, webhooks or refund API exist, so the requested gateway, webhook-signature, duplicate-webhook and refund-authorization tests do not apply. They are listed here as *not applicable*, not as passed.

## Rule coverage
| Rule | Implemented | Tested by | Result |
|---|---|---|---|
| Server computes prices; client prices ignored | `ShopController.php:164-176` | E2E `client-supplied prices are ignored` · `run.php` pricing | ✅ pass |
| Order total equals `/checkout/quote` total | `CheckoutPricing::quote` | E2E (same test) | ✅ pass |
| Discount code + min spend | `CheckoutPricing.php` | `run.php` "server shipping and discount pricing" | ✅ pass |
| Free-shipping threshold | `CheckoutPricing.php` | `run.php` | ✅ pass |
| Stock decremented on order | conditional `decrement` `ShopController.php:170` | `run.php`, E2E journey | ✅ pass |
| Overselling rejected (409) | same | `run.php`, E2E `overselling is rejected` (3XL stock 0) | ✅ pass |
| Failed checkout rolls back | `DB::transaction` | `run.php` | ✅ pass |
| Idempotent retry (same `request_id`) | `insertOrIgnore` + fingerprint | `run.php`, E2E | ✅ pass |
| Same key with a different body → 409 | fingerprint compare | E2E | ✅ pass |
| Cancel restores stock exactly once | `OrderLifecycle.php:12-14` + unique `(order_id,sku,reason)` | `run.php` | ✅ pass |
| Invalid transitions → 409 | `OrderLifecycle.php:10-11` | `run.php` | ✅ pass |
| Non-COD payment rejected by API | `payment_method in:cod` | E2E | ✅ pass |
| Staff stock edit conflict → 409 | `ProductEditorController` | `run.php` (per README) | ✅ pass |
| Full UI journey: product → cart → checkout → receipt | — | E2E `customer buys a product with cash on delivery` | ✅ pass |
| Concurrent last-item purchase on PostgreSQL | conditional decrement | — | ⚠ untested (SQLite serializes writes) |
| Stock reconciliation `stock == Σ movements` | — | — | ❌ not possible (EC-02) |
| Price/stock edits audited | — | — | ❌ missing (EC-03) |
| Returns / refunds | partial (`returned` status) | — | ❌ gap (EC-04) |
| Password reset | — | — | ❌ feature missing (EC-06) |

## Findings

### EC-01 — Checkout offers card and InstaPay but always places a COD order
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `frontend/src/views/CheckoutView.vue:355-415` (options), `:133` (`payment_method: 'cod'` hard-coded); settings keys `card/instapay/vodafone_cash` in `backend/routes/web.php:289` | Status | Open |

**Impact.** A customer who picks "card" gets a cash order without being told. That leads to disputes at the door, refused deliveries, and lost trust. The admin toggles for these methods do nothing.
**Fix.** Show only the methods the backend accepts (COD) until a gateway is integrated. Drive the options from `/storefront` settings and validate them on the server.
**Test.** E2E: the checkout page shows exactly the methods the API accepts.

### EC-02 — Staff stock edits bypass the inventory ledger
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `backend/app/Http/Controllers/ProductEditorController.php:103-130`, `backend/routes/web.php:451-470`; schema `inventory_movements.order_id` NOT NULL (`2026_11_19_000009…:9`) | Status | Open |

**Root cause.** `inventory_movements` requires an `order_id`, so manual adjustments cannot be recorded. Only sales and restores are logged.
**Impact.** Stock can't be reconciled. Shrinkage, mistakes, or a malicious staff edit leave no trace.
**Fix.** Make `order_id` nullable, add an `actor_email` column, and write `reason='adjustment'` rows with the delta in the same transaction as the edit.
**Test.** After a staff edit from 5 to 7, expect one movement of +2 with the actor recorded.

### EC-03 — Price and stock changes are not in the audit log
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `POST /staff/products` (`web.php:431`) and `ProductEditorController::save` never call `$logAudit`/insert `audit_events` | Status | Open |

The README requires audit records for privilege, price and stock changes. Publish, delete, settings and order status are audited, but price and stock are not. **Fix.** Log `product.updated` with old and new price and the stock deltas. **Test.** Assert an `audit_events` row after a product save.

### EC-04 — Returns restock automatically; refunds are not tracked
| Severity | **Medium** | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
| Location | `backend/app/Services/OrderLifecycle.php:10-14` | Status | Open |

`shipped|delivered → returned` adds every line back to sellable stock immediately. There are no partial returns, no condition check, and no record of the cash refunded to the customer. The tracking endpoint has no label for `returned`.
**Fix.** Add a returns table (lines, condition, restock yes/no, refund amount, method, actor). Restock only on inspection.
**Test.** A partial return restocks only the returned quantity, and the refund amount can't exceed the line total.

### EC-05 — Concurrency is only tested on SQLite
| Severity | Low | Confidence | Untested | Priority | P2 |
|---|---|---|---|---|---|
The conditional decrement (`WHERE stock >= qty`) is the right design. On PostgreSQL, `sharedLock()` on `catalog_products` plus row-level updates should be safe, but no test runs two simultaneous orders for the last unit there. **Test.** A PostgreSQL CI service plus two parallel `curl` orders for stock 1: exactly one 201 and one 409.

### EC-06 — No password reset for customers or staff
| Severity | Low | Priority | P2 |
|---|---|---|---|
There are no routes for reset or recovery. Customers who forget a password must re-register, and the email is blocked as already registered.

### EC-07 — Discounts can be set to 100%
| Severity | Informational | Location | `backend/routes/web.php:290` (`percent between:1,100`) |
|---|---|---|---|
A mistyped admin setting can make orders free. Consider a cap (for example 70%) or a confirmation step, and audit-log discount changes (settings changes are already audited).
