<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\ShopController;

$passed = 0;
$failed = 0;

function assertTest(bool $condition, string $title): void {
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "[PASS] " . $title . PHP_EOL;
    } else {
        $failed++;
        echo "[FAIL] " . $title . PHP_EOL;
    }
}

echo "=== CACHE CORRECTNESS VERIFICATION SUITE ===" . PHP_EOL;

// 1. Cold Cache Test
Cache::forget('shop_catalog_v1');
$controller = new ShopController();

$t0 = microtime(true);
$resCold = $controller->catalog(Request::create('/api/v1/products', 'GET'));
$coldDuration = (microtime(true) - $t0) * 1000;

assertTest($resCold->getStatusCode() === 200, "Cold cache returns HTTP 200");
$etagCold = $resCold->headers->get('ETag');
assertTest(!empty($etagCold) && str_starts_with($etagCold, '"'), "Cold cache creates valid quoted ETag: " . $etagCold);
assertTest($resCold->headers->get('Cache-Control') === 'max-age=30, public, stale-while-revalidate=60', "Cache-Control header configured correctly");

// 2. Warm Cache Test
$t1 = microtime(true);
$resWarm = $controller->catalog(Request::create('/api/v1/products', 'GET'));
$warmDuration = (microtime(true) - $t1) * 1000;

assertTest($resWarm->getStatusCode() === 200, "Warm cache returns HTTP 200");
$etagWarm = $resWarm->headers->get('ETag');
assertTest($etagCold === $etagWarm, "Warm cache returns identical ETag");
assertTest($warmDuration <= $coldDuration || $warmDuration < 10.0, sprintf("Warm cache latency (%.2fms) is fast", $warmDuration));

// 3. Conditional GET (304 Not Modified)
$reqConditional = Request::create('/api/v1/products', 'GET');
$reqConditional->headers->set('If-None-Match', $etagCold);
$res304 = $controller->catalog($reqConditional);

assertTest($res304->getStatusCode() === 304, "Matching If-None-Match returns HTTP 304 Not Modified");
assertTest(empty($res304->getContent()), "HTTP 304 response body is empty (zero payload)");
assertTest($res304->headers->get('ETag') === $etagCold, "HTTP 304 preserves ETag header");

// 4. Cache Invalidation on Data Mutation
ShopController::bustCatalogCache();
assertTest(!Cache::has('shop_catalog_v1'), "bustCatalogCache() clears cache key");

// Simulate product update: change updated_at or toggle
$prod = DB::table('catalog_products')->first();
if ($prod) {
    $origPublished = (bool) $prod->published;
    DB::table('catalog_products')->where('id', $prod->id)->update(['published' => !$origPublished]);
    ShopController::bustCatalogCache();

    $resNew = $controller->catalog(Request::create('/api/v1/products', 'GET'));
    $etagNew = $resNew->headers->get('ETag');

    assertTest($etagNew !== $etagCold, "Modified product data produces new ETag (old invalidated)");

    // Restore original state
    DB::table('catalog_products')->where('id', $prod->id)->update(['published' => $origPublished]);
    ShopController::bustCatalogCache();
} else {
    echo "[SKIP] No catalog products found for mutation test." . PHP_EOL;
}

// 5. Data Privacy Audit: Shared Cache must NEVER leak private customer data
$controller->catalog(Request::create('/api/v1/products', 'GET')); // Warm cache
$cached = Cache::get('shop_catalog_v1');
assertTest(!empty($cached), "Cache is populated");
$cachedPayload = json_decode($cached['json'] ?? '{}', true);

$hasCustomerData = isset($cachedPayload['customer']) || isset($cachedPayload['orders']) || isset($cachedPayload['users']) || isset($cachedPayload['email']);
assertTest(!$hasCustomerData, "Shared catalog cache contains ZERO private customer data");

$allowedKeys = ['categories', 'productTypes', 'collections', 'products', 'shipping'];
$actualKeys = array_keys($cachedPayload);
$extraKeys = array_diff($actualKeys, $allowedKeys);
assertTest(empty($extraKeys), "Shared cache payload strictly limited to public catalog schema");

echo sprintf("RESULTS: %d PASSED, %d FAILED" . PHP_EOL, $passed, $failed);
exit($failed > 0 ? 1 : 0);
