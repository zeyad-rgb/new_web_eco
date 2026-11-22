<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

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

echo "=== TRACK A: RATE LIMITING & SECURITY VERIFICATION ===" . PHP_EOL;

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// 1. Verify Auth Rate Limiter (5 requests per minute max)
$testIp = '198.51.100.' . random_int(1, 200);
$authThrottled = false;

// Step 1a: Get valid session & CSRF token from /staff/session
$sessionReq = Request::create('/staff/session', 'GET', server: [
    'REMOTE_ADDR' => $testIp,
    'HTTP_ACCEPT' => 'application/json',
]);
$sessionRes = $kernel->handle($sessionReq);
$sessionData = json_decode($sessionRes->getContent(), true);
$csrfToken = $sessionData['csrf'] ?? '';
$sessionCookies = [];
foreach ($sessionRes->headers->getCookies() as $c) {
    $sessionCookies[$c->getName()] = $c->getValue();
}

for ($i = 1; $i <= 8; $i++) {
    $req = Request::create('/staff/login', 'POST', [
        'email' => 'nobody@example.com',
        'password' => 'invalid-password',
    ], cookies: $sessionCookies, server: [
        'REMOTE_ADDR' => $testIp,
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_X_CSRF_TOKEN' => $csrfToken,
    ]);

    $res = $kernel->handle($req);
    $status = $res->getStatusCode();

    if ($status === 429) {
        $authThrottled = true;
        break;
    }
}

assertTest($authThrottled, "Brute-force protection on /staff/login triggers HTTP 429 after 5 attempts");

// 2. Verify Orders Rate Limiter (10 requests per minute max)
$orderIp = '198.51.100.' . random_int(1, 200);
$ordersThrottled = false;

for ($i = 1; $i <= 15; $i++) {
    $req = Request::create('/api/v1/orders/track', 'POST', [
        'order_id' => 'nonexistent',
    ], server: [
        'REMOTE_ADDR' => $orderIp,
        'HTTP_ACCEPT' => 'application/json',
    ]);

    $res = $kernel->handle($req);
    if ($res->getStatusCode() === 429) {
        $ordersThrottled = true;
        break;
    }
}

assertTest($ordersThrottled, "Spam protection on /api/v1/orders/track triggers HTTP 429 after 10 attempts");

// 3. Verify Track B Benchmark Token Bypass in Non-Production (staging/testing)
$secureToken = 'staging-benchmark-secret-token-1234567890';
putenv("BENCHMARK_TOKEN={$secureToken}");
$_ENV['BENCHMARK_TOKEN'] = $secureToken;
config(['app.env' => 'staging']);

$benchIp = '198.51.100.99';
$benchBlocked = false;

for ($i = 1; $i <= 20; $i++) {
    $req = Request::create('/customer/session', 'GET', server: [
        'REMOTE_ADDR' => $benchIp,
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_X_BENCHMARK_TOKEN' => $secureToken,
    ]);

    $res = $kernel->handle($req);
    if ($res->getStatusCode() === 429) {
        $benchBlocked = true;
        break;
    }
}

assertTest(!$benchBlocked, "Track B: Valid X-Benchmark-Token permits capacity testing in staging");

// 4. STRICT PRODUCTION TEST: When APP_ENV=production, X-Benchmark-Token MUST BE REJECTED
config(['app.env' => 'production']);
$prodThrottled = false;
$prodIp = '198.51.100.77';

for ($i = 1; $i <= 15; $i++) {
    $req = Request::create('/api/v1/orders/track', 'POST', [
        'order_id' => 'nonexistent',
    ], server: [
        'REMOTE_ADDR' => $prodIp,
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_X_BENCHMARK_TOKEN' => $secureToken, // Attacker attempts bypass
    ]);

    $res = $kernel->handle($req);
    if ($res->getStatusCode() === 429) {
        $prodThrottled = true;
        break;
    }
}

assertTest($prodThrottled, "SECURITY ASSURANCE: When APP_ENV=production, X-Benchmark-Token CANNOT bypass rate limiting (triggers 429)");
config(['app.env' => 'local']);

echo sprintf("TRACK A RESULTS: %d PASSED, %d FAILED" . PHP_EOL, $passed, $failed);
exit($failed > 0 ? 1 : 0);
