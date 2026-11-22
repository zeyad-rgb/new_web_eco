# Studio Active

Studio Active is a temporary project name. The catalog is sample data.

## Local development

Install PHP 8.4 with the Laravel extensions (including mbstring, DOM, cURL,
OpenSSL and PDO), Composer 2 and Node 22.12 or later. Run from this project in
PowerShell:

    cd backend
    New-Item -ItemType Directory -Force bootstrap/cache,storage/framework/cache/data,storage/framework/views,storage/framework/sessions,storage/logs | Out-Null
    composer install
    Copy-Item .env.example .env
    php artisan key:generate
    php artisan migrate --seed
    php artisan serve --host=127.0.0.1

Before migrating, create a PostgreSQL database and set DB_CONNECTION=pgsql, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME and DB_PASSWORD in backend/.env. Enable pdo_pgsql. Run the seed command only for demo data.

In another terminal:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173. Verify /api/v1/products through the Vite proxy and
run npm run build for a production frontend build. The API health endpoint is
http://127.0.0.1:8000/up. Commit both dependency lockfiles once installation
succeeds so CI and deployments can reproduce the build.

## Architecture and implementation plan

Vue 3, TypeScript and Vite make up the storefront. Laravel 13 and PHP 8.4 own
the API and business rules. For launch, target PostgreSQL and Redis. Deploy the
storefront and API under the same HTTPS origin, routing /api to Laravel.
Organize one backend into catalog, inventory, orders and identity modules.

1. Catalog and inventory. Store localized products, color and size variants,
   unique SKUs, price in integer piastres, and stock by fulfillment location.
   Use indexed server-side filters and paginated responses. Decide whether the
   online store or the shared branch and wholesale system owns available stock.
2. Cart and checkout. Treat the browser's selections as a request only. Laravel
   computes prices, discounts and delivery, validates availability in a database
   transaction, and creates the order with a unique idempotency key. Tests must
   cover duplicate requests, competing buyers for the last item and rollback.
3. Back office. Use Laravel Sanctum cookie sessions and CSRF protection for the
   first-party SPA. Add MFA for staff, role and record-level authorization with
   Laravel policies, and audit records for privilege, price and stock changes.
4. Processing and operations. Use Redis for shared rate limits and queue
   workers for notifications and delivery integrations. Verify webhook
   signatures and replay protection, deduplicate provider events in the database,
   and reconcile orders and external events. Monitor queue and HTTP latency.
5. Before release, run dependency audits, authorization and checkout tests,
   representative load tests and a backup restore rehearsal. Keep debug off,
   secrets outside source control, and sensitive order data out of logs.

Current scope includes the Arabic catalog, SKU availability, cart, and guest
checkout. The Laravel API calculates totals, encrypts customer contact details,
and writes stock changes and orders in one transaction. The shipping fee is a
demo default. Staff authentication, Redis and production release checks remain
planned.

Open StudioActive-preview.html in a browser for a standalone Vue preview. Its
orders are simulated in memory. The real API is only used by the normal build.

## Categories and collections

Run php artisan migrate --seed from backend to install taxonomy and demo stock.
A product has one category and can belong to multiple collections. The catalog
API reads these relationships from the database.

    php artisan catalog:group category tops "ملابس علوية" training-tee
    php artisan catalog:group collection winter "مجموعة الشتاء" training-tee cotton-pants

Reuse a slug to rename a group. Product IDs are optional. Adding products to a
collection preserves existing membership. Assigning a category moves the
specified products into that category. These commands require shell access to
the Laravel application. Refresh the storefront after changes.

## Application screens and staff access

The storefront has independent routes for Home, Discover, Shop, Product, Cart,
Checkout, and order confirmation. Discover leads to categories and collections.
Use the footer link to open staff screens. Standalone preview changes are
temporary. The normal Vue build saves staff changes through Laravel.

From backend after configuring PostgreSQL:

    php artisan migrate
    php artisan catalog:staff manager@example.com

Enter the password at the hidden prompt. Staff authorization is checked on
each management request. Route /staff to Laravel on the same HTTPS origin
and set SESSION_SECURE_COOKIE=true in production. Staff can create or rename
categories, edit products, publish drafts, and set stock by color and size.

Staff links: #/admin/categories, #/admin/products and #/admin/products/new.
The product list can be filtered by publication state. A stock edit submits the
original counts of edited variants. If checkout or another staff member has
changed one of those counts, Laravel returns 409 and rolls back the edit.
Reopen the product from the list to use the refreshed counts. The preview
reflects staff changes in the storefront until it is reloaded.

Category and collection URLs are #/shop/category/<slug> and
#/shop/collection/<slug>. Products may supply an ordered images array in their
catalog details. The same gallery is used on cards and product pages. With a
single image the thumbnail bar is hidden. Demo products without an images
array show a detail crop from the existing campaign photo. Favorites are
stored on the current device.

## Category tree and shared product types

Run php artisan migrate from backend to add the hierarchy to an existing
database. Existing product category IDs are retained. The demo tees, shorts
and bottoms are placed under Men > Clothing.

The categories table has an indexed self-referencing parent_slug and an
optional type_slug referencing product_types. Slugs are unique and stay
stable during a rename or move. PostgreSQL serializes tree moves while
the API rejects cycles. catalog_products.category_slug remains the product
assignment. Opening a branch includes products from its descendants.

From #/admin/categories a catalog manager can create a root, add a child,
move an existing category, or assign a shared product type. Use the Add
Product action on any row to preselect its full category path, or open
#/admin/products/new directly. Both tees branches reference t-shirts.
#/shop/type/t-shirts shows both branches. Collections retain their own
curated product memberships.

The preview demonstrates this with a sample women's tee and in-memory edits.
The database-backed app shows products published through staff management.
See frontend/src/Admin.vue for the forms and backend/routes/web.php for the
authorized writes.

## Product options and media

ProductEditor.vue is the product form. New products start with empty color
and size options. Each selected color has a stable UUID, name, swatch hex and
ordered image URLs. Each selected color and size combination has its own SKU
and stock. Legacy variants retain their SKU on first save. Removed options
remove their variants only when saving the complete product. Original stock
counts are checked in the transaction to reject stale edits.

Upload JPG, PNG or WebP files, at most 10 MB each. Configure PHP
upload_max_filesize=10M and post_max_size=12M and the web server request size
to support the same limit. The form uploads one image per request, retains
successful uploads after a partial failure and supports up to 250 media
references per product. The first image of the first color is the main image.
Images can be reordered and removed from their color. Unassigned upload files
are retained for retry and will require a retention policy in production.

Run php artisan migrate to create product_media and the variant color_key.
Uploads require the existing catalog-manager session and CSRF token.
ProductEditorController validates actual image MIME types, file sizes and
dimensions and checks file ownership when saving. /media URLs expose
published product images and allow staff to preview drafts. Serve /media
through Laravel alongside /staff. The preview uses local FileReader data URLs,
so its uploads and edits last until the page reloads.

The storefront gallery and color selection use colorOptions images. Size
choices come from the selected product variants. Preview testing used five
custom colors, two sizes and fifty files, verified ordering and save/reopen,
and checked the card and detail galleries.

## Hardened runtime (2026-11-19)

Run isolated checks from the project root with PHP 8.4: `php backend/tests/run.php`. Tests use SQLite in memory. Apply new migrations with `php backend/artisan migrate --force`; never migrate:fresh against store data.

Old staff sessions are invalidated. Sign in using the real password. If the previous email bypass changed it, reset it from the trusted server console using `php backend/artisan security:admin YOUR_EMAIL`.

Run notification processing with `php backend/artisan queue:work --tries=3 --timeout=30`. The database queue insert shares the order transaction. Monitor worker uptime and failed_jobs. Only cash-on-delivery is currently accepted. Online payments need merchant credentials and verified webhooks. Password recovery needs an email provider; the UI does not report fake delivery.

### Production template

Copy .env.production.example to .env.production; set APP_KEY, DB_PASSWORD and your domain. Keep the existing APP_KEY when moving encrypted customer/order data. Docker files are templates and have not been built here. Existing SQLite data is not automatically copied into PostgreSQL.

Run `docker compose --env-file .env.production build`, start db and redis, then `docker compose --env-file .env.production run --rm app php artisan migrate --force`, provision an admin through the console, and start the services. Use HTTPS termination in front of localhost:8080. Run security:readiness in the app container. Redis provides shared cache and sessions; database and media use persistent volumes. Do not expose database or Redis ports publicly.

Back up PostgreSQL with pg_dump plus product-media to encrypted off-host storage. Test pg_restore and media recovery on a separate staging instance before launch. Store APP_KEY securely; encrypted orders depend on it. No real backup schedule or provider account has been activated.

### Verification and remaining launch work

Run `k6 run -e BASE_URL=https://YOUR-STAGING perf/catalog.js` only against infrastructure you control. It exercises catalog reads up to 100 virtual users; it does not prove 60,000 concurrent visitors or checkout throughput. Monitor CPU, RAM, PHP workers, DB locks, latency and errors. Checkout concurrency and recovery still need testing on staging.

Admin orders and registered customers have 50-row pages. Revenue counts delivered orders and is not a payment settlement report. Historic guest orders remain visible under orders. The storefront still loads the complete catalog; full server-side storefront filtering/pagination remains work. Customer email verification/recovery, payment integration, CDN provisioning and multiple image resolutions also remain. New uploads are re-encoded as WebP with a 1600px maximum edge and pixel limits. media:cleanup previews unattached uploads older than seven days; --delete removes them.

## Reliable local image uploads

Start the backend from the project root with `./backend/serve.ps1 -Port 8009` (pass -PhpPath if PHP is not on PATH). Vite proxies backend routes to port 8009. This launcher applies 10 MiB upload_max_filesize, 12 MiB post_max_size and 256 MiB memory_limit to the actual PHP server process. PHP CLI built-in servers do not apply .user.ini. Existing independently launched PHP processes keep their original limits until restarted.

For PHP-FPM/CGI deployments, backend/public/.user.ini provides equivalent limits; the Docker PHP image loads deploy/uploads.ini. The authenticated staff/media/limits endpoint reports the effective limit. The editor displays it and preserves detailed validation errors. Supported uploads are JPG, PNG and WebP (24 megapixels maximum); HEIC files must be converted before upload.
