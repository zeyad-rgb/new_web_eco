<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\ShopController;

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "=== LATENCY BREAKDOWN & EXECUTION PROFILE ===" . PHP_EOL;

// 1. Cold Cache Measurement
Cache::forget('shop_catalog_v1');
$controller = new ShopController();

$reqCold = Request::create('/api/v1/products', 'GET');
$t0 = microtime(true);
$resCold = $controller->catalog($reqCold);
$controllerColdTime = (microtime(true) - $t0) * 1000;

// 2. Warm Cache Measurement: Pure Cache Store Lookup
$t1 = microtime(true);
$cachedRaw = Cache::get('shop_catalog_v1');
$cacheLookupTime = (microtime(true) - $t1) * 1000;

// 3. Warm Cache Measurement: Controller Action
$reqWarm = Request::create('/api/v1/products', 'GET');
$t2 = microtime(true);
$resWarm = $controller->catalog($reqWarm);
$controllerWarmTime = (microtime(true) - $t2) * 1000;

// 4. Conditional GET Measurement: Controller Action (304 Not Modified)
$req304 = Request::create('/api/v1/products', 'GET');
$req304->headers->set('If-None-Match', $resWarm->headers->get('ETag'));
$t3 = microtime(true);
$res304 = $controller->catalog($req304);
$controller304Time = (microtime(true) - $t3) * 1000;

// 5. Full Pipeline Measurement (Kernel + Middleware + Routing + Output)
$t4 = microtime(true);
$reqPipeline = Request::create('/api/v1/products', 'GET', server: ['HTTP_ACCEPT' => 'application/json']);
$resPipeline = $kernel->handle($reqPipeline);
$pipelineWarmTime = (microtime(true) - $t4) * 1000;

echo sprintf("  • Cold Cache Controller Time (DB Miss + ETag Build): %.3f ms" . PHP_EOL, $controllerColdTime);
echo sprintf("  • Cache Store Lookup Time (File/Redis Cache::get):     %.3f ms" . PHP_EOL, $cacheLookupTime);
echo sprintf("  • Warm Cache Controller Time (200 JSON Response):     %.3f ms" . PHP_EOL, $controllerWarmTime);
echo sprintf("  • Conditional Revalidation Controller Time (304):      %.3f ms" . PHP_EOL, $controller304Time);
echo sprintf("  • Full Kernel Pipeline Time (Routing + Middleware):    %.3f ms" . PHP_EOL, $pipelineWarmTime);
echo "=============================================" . PHP_EOL;
