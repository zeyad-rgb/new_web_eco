<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ShopController
{
    private const SHIPPING = 8500;
    private const CATALOG_CACHE_KEY = 'shop_catalog_v1';
    private const CATALOG_CACHE_TTL = 60; // seconds

    private function products(): array
    {
        return DB::table('catalog_products')->where('published', true)->whereNotNull('details')->orderBy('id')
            ->pluck('details')->map(fn (string $details) => json_decode($details, true, flags: JSON_THROW_ON_ERROR))->all();
    }

    /**
     * Public catalog endpoint — cached for 60 seconds with ETag support.
     * On cache hit: 0 DB queries. On cache miss: 4 DB queries (down from 7).
     */
    public function catalog(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $cached = Cache::get(self::CATALOG_CACHE_KEY);
        if (!$cached) {
            // Relational SQL JOIN between products and categories (single query for product + category name)
            $productsRaw = DB::table('catalog_products')
                ->leftJoin('categories', 'catalog_products.category_slug', '=', 'categories.slug')
                ->where('catalog_products.published', true)
                ->whereNotNull('catalog_products.details')
                ->orderBy('catalog_products.id')
                ->get([
                    'catalog_products.id',
                    'catalog_products.details',
                    'catalog_products.category_slug',
                    'categories.name as category_name',
                ]);

            $variants = DB::table('variants')->orderBy('sku')
                ->get(['sku', 'product_id', 'color', 'size', 'stock', 'color_key'])
                ->groupBy('product_id');

            $categories = DB::table('categories')->orderBy('name')->get();
            $productTypes = DB::table('product_types')->orderBy('name')->get();
            $collections = DB::table('collections')->orderBy('name')->get();
            $memberships = DB::table('collection_product')->get()->groupBy('product_id');

            $products = $productsRaw->map(function ($row) use ($variants, $memberships) {
                $product = json_decode($row->details, true, flags: JSON_THROW_ON_ERROR);
                return [
                    ...$product,
                    'categoryId' => $row->category_slug,
                    'category' => $row->category_name ?? '',
                    'collections' => $memberships->get($row->id, collect())->pluck('collection_slug')->values(),
                    'variants' => $variants->get($row->id, collect())->map(fn ($v) => [...(array) $v, 'colorId' => $v->color_key])->values(),
                ];
            })->values();

            $shippingSetting = \App\Services\CheckoutPricing::setting('shipping', [
                'fee' => 8500,
                'free_threshold' => 80000,
            ]);
            $storefrontSetting = \App\Services\CheckoutPricing::setting('storefront', [
                'announcement_text' => 'Free shipping over 4000 EGP',
                'visit_label' => 'Visit Us',
                'location_url' => '',
            ]);
            $whatsappSetting = \App\Services\CheckoutPricing::setting('whatsapp', [
                'enabled' => true,
                'support_phone' => '01000000000',
                'welcome_message' => 'Hello, I would like to ask about your products.',
            ]);
            $payload = [
                'categories' => $categories,
                'productTypes' => $productTypes,
                'collections' => $collections,
                'products' => $products,
                'shipping' => (int)($shippingSetting['fee'] ?? 8500),
                'shippingSettings' => $shippingSetting,
                'storefrontSettings' => $storefrontSetting,
                'whatsappSettings' => $whatsappSetting,
            ];
            $rawJson = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            $etag = '"' . md5($rawJson) . '"';

            $cached = [
                'json' => $rawJson,
                'etag' => $etag,
            ];

            Cache::put(self::CATALOG_CACHE_KEY, $cached, self::CATALOG_CACHE_TTL);
        }

        // Support backward compatibility if cache was stored in old format
        $etag = $cached['etag'] ?? ('"' . md5(json_encode($cached)) . '"');
        $rawJson = $cached['json'] ?? json_encode($cached, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);

        // Conditional GET: Return 304 Not Modified with empty body
        if ($request->header('If-None-Match') === $etag) {
            return response('', 304, ['ETag' => $etag]);
        }

        return response($rawJson, 200, [
            'Content-Type' => 'application/json',
            'Cache-Control' => 'public, max-age=30, stale-while-revalidate=60',
            'ETag' => $etag,
        ]);
    }

    /**
     * Invalidate the catalog cache when products/categories change.
     * Call this from any admin write endpoint.
     */
    public static function bustCatalogCache(): void
    {
        Cache::forget(self::CATALOG_CACHE_KEY);
    }

    public function order(Request $request): JsonResponse
    {
        $data = $request->validate([
            'request_id' => ['required', 'uuid'],
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'regex:/\A01[0125][0-9]{8}\z/'],
            'address' => ['required', 'string', 'max:250'],
            'items' => ['required', 'array', 'list', 'min:1', 'max:20'],
            'payment_method' => ['sometimes', 'in:cod'],
            'discount_code' => ['nullable','string','max:80'],
            'items.*' => ['required', 'array:sku,quantity'],
            'items.*.sku' => ['required', 'string', 'max:80', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'between:1,10'],
        ]);
        $pricingInput = ['method'=>$data['payment_method']??'cod','code'=>$data['discount_code']??''];
        $items = collect($data['items'])->sortBy('sku')->values();
        $customer = ['name' => $data['name'], 'phone' => $data['phone'], 'address' => $data['address']];
        $fingerprint = hash_hmac('sha256', json_encode([$items, $customer, $pricingInput], JSON_THROW_ON_ERROR), config('app.key'));
        $requestId = strtolower($data['request_id']);

        return DB::transaction(function () use ($items, $customer, $fingerprint, $requestId, $pricingInput, $request): JsonResponse {
            $id = (string) Str::uuid();
            $created = DB::table('orders')->insertOrIgnore([
                'id' => $id, 'request_id' => $requestId, 'fingerprint' => $fingerprint,
                'customer' => Crypt::encryptString(json_encode($customer, JSON_THROW_ON_ERROR)),
                'customer_id' => $request->session()->get('customer_id'),
                'lines' => '[]', 'total' => 0, 'created_at' => now(),
            ]);
            if (!$created) {
                $existing = DB::table('orders')->where('request_id', $requestId)->first();
                abort_unless($existing && hash_equals($existing->fingerprint, $fingerprint), 409, 'بيانات الطلب اتغيّرت.');
                return response()->json([
                    'id' => $existing->id,
                    'total' => (int) $existing->total,
                ]);
            }

            $total = 0;
            $lines = [];
            foreach ($items as $item) {
                $variant = DB::table('variants')->where('sku', $item['sku'])->first();
                $details = $variant ? DB::table('catalog_products')->where('id', $variant->product_id)
                    ->where('published', true)->sharedLock()->value('details') : null;
                $product = $details ? json_decode($details, true, flags: JSON_THROW_ON_ERROR) : null;
                abort_unless($product, 409, 'اختيار المنتج غير متاح.');
                $quantity = (int) $item['quantity'];
                $updated = DB::table('variants')->where('sku', $variant->sku)
                    ->where('stock', '>=', $quantity)->decrement('stock', $quantity);
                abort_unless($updated === 1, 409, 'المخزون اتغيّر. راجع السلة وحاول تاني.');
                DB::table('inventory_movements')->insert(['sku'=>$variant->sku,'order_id'=>$id,'quantity'=>-$quantity,'reason'=>'sale','created_at'=>now()]);
                $lines[] = ['sku' => $variant->sku, 'quantity' => $quantity, 'price' => $product['price']];
                $total += $product['price'] * $quantity;
            }
            $quote = \App\Services\CheckoutPricing::quote($total,$pricingInput['method'],$pricingInput['code']);
            $total = $quote['total'];
            DB::table('orders')->where('id', $id)->update([
                ...$quote,
                'lines' => json_encode($lines, JSON_THROW_ON_ERROR), 'total' => $total,
            ]);

            // Database queue insert participates in this transaction (same DB connection).
            \App\Jobs\SendOrderConfirmation::dispatch($id);
            DB::afterCommit(fn () => self::bustCatalogCache());

            return response()->json([
                'id' => $id,
                'total' => $total,
            ], 201);
        }, 3);
    }

    public function trackOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'string', 'max:100'],
        ]);

        $order = DB::table('orders')->where('id', $data['order_id'])->first();

        if (!$order) {
            return response()->json(['message' => 'لم يتم العثور على طلب بهذا الرقم.'], 404);
        }

        $customer = [];
        try {
            $customer = json_decode(Crypt::decryptString($order->customer), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            // Customer data fallback
        }

        $lines = [];
        try {
            $lines = json_decode($order->lines, true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            // Lines fallback
        }

        $status = $order->status ?? 'processing';
        $statusLabels = [
            'processing' => 'قيد التجهيز والتعبئة',
            'shipped' => 'تم الشحن مع مندوب التوصيل',
            'delivered' => 'تم التوصيل بنجاح',
            'cancelled' => 'تم إلغاء الطلب',
        ];

        $rawName = trim($customer['name'] ?? '');
        $maskedName = '';
        if ($rawName) {
            $words = explode(' ', $rawName);
            if (count($words) > 1) {
                $maskedName = $words[0] . ' ' . mb_substr($words[1], 0, 1) . '***';
            } else {
                $maskedName = mb_substr($rawName, 0, 2) . '***';
            }
        }

        return response()->json([
            'id' => $order->id,
            'status' => $status,
            'status_label' => $statusLabels[$status] ?? 'قيد المعالجة',
            'created_at' => $order->created_at,
            'total' => (int) $order->total,
            'customer_name' => $maskedName ?: 'عميل',
            'governorate' => explode(' - ', $customer['address'] ?? '')[0] ?? '',
            'items_count' => count($lines),
        ]);
    }
}





