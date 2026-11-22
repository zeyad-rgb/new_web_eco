<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        /**
         * Strictly fail-closed benchmark exemption logic:
         * 1. Production environments (APP_ENV=production) can NEVER bypass rate limiting under any circumstances.
         * 2. Public headers are strictly ignored in production.
         * 3. Only dedicated isolated non-production environments (staging, testing, local) with valid secret token can be exempted.
         */
        $isBenchmarkAllowed = static function (Request $request): bool {
            // Fail closed: Production environment NEVER permits bypass
            if (App::isProduction() || config('app.env') === 'production') {
                return false;
            }

            if (filter_var(env('RATE_LIMIT_DISABLED', false), FILTER_VALIDATE_BOOLEAN)) {
                return true;
            }

            $token = env('BENCHMARK_TOKEN');
            if (empty($token) || strlen($token) < 32) {
                return false; // Require high-entropy token in staging/testing
            }

            $supplied = (string) $request->header('X-Benchmark-Token', '');
            return !empty($supplied) && hash_equals((string) $token, $supplied);
        };

        RateLimiter::for('api', function (Request $request) use ($isBenchmarkAllowed): Limit {
            if ($isBenchmarkAllowed($request)) return Limit::none();
            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('catalog', function (Request $request) use ($isBenchmarkAllowed): Limit {
            if ($isBenchmarkAllowed($request)) return Limit::none();
            $limit = (int) env('RATE_LIMIT_CATALOG', 1200);
            return $limit > 0 ? Limit::perMinute($limit)->by($request->ip()) : Limit::none();
        });

        RateLimiter::for('session', function (Request $request) use ($isBenchmarkAllowed): Limit {
            if ($isBenchmarkAllowed($request)) return Limit::none();
            $limit = (int) env('RATE_LIMIT_SESSION', 300);
            return $limit > 0 ? Limit::perMinute($limit)->by($request->ip()) : Limit::none();
        });

        RateLimiter::for('orders', function (Request $request) use ($isBenchmarkAllowed): Limit {
            if ($isBenchmarkAllowed($request)) return Limit::none();
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('quote', function (Request $request) use ($isBenchmarkAllowed): Limit {
            if ($isBenchmarkAllowed($request)) return Limit::none();
            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('auth', function (Request $request): Limit {
            // Authentication brute force protection is ALWAYS enforced, zero exceptions
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
