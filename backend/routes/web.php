<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

Route::prefix('staff')->group(function (): void {
    // ── Per-request cached staff lookup (1 DB query max, not 2+) ──
    $staff = static function (Request $request): ?object {
        if ($request->attributes->has('_cached_staff')) {
            return $request->attributes->get('_cached_staff');
        }
        $login = $request->session()->get('catalog_staff');
        if (!is_array($login) || ($login['verified_password'] ?? false) !== true) {
            $request->attributes->set('_cached_staff', null);
            return null;
        }
        $user = DB::table('catalog_staff')->where('email', $login['email'])->where('active', true)->first();
        $result = $user && hash_equals(hash('sha256', $user->password_hash), $login['version']) ? $user : null;
        $request->attributes->set('_cached_staff', $result);
        return $result;
    };
    $authorize = static function (Request $request) use ($staff): void {
        abort_unless(in_array($staff($request)?->role, ['admin', 'catalog_manager'], true), 403);
    };
    // Admin-only gate. Reads the role from the database on every request (via $staff),
    // never from the session, so demoting or deactivating an admin takes effect immediately.
    $authorizeAdmin = static function (Request $request) use ($staff): void {
        abort_unless($staff($request)?->role === 'admin', 403);
    };

    $logAudit = static function (string $actorEmail, string $event, ?string $subjectType = null, ?string $subjectId = null, array $metadata = [], ?string $ip = null): void {
        unset($metadata['password'], $metadata['password_hash'], $metadata['token'], $metadata['csrf']);
        DB::table('audit_events')->insert([
            'actor_email' => $actorEmail,
            'event' => $event,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
            'ip_address' => $ip,
            'created_at' => now(),
        ]);
    };

    Route::get('/session', static function (Request $request) use ($staff) {
        $user = $staff($request);
        return response()->json([
            'signedIn' => (bool) $user, 'csrf' => $request->session()->token(), 'role' => $user?->role, 'email' => $user?->email,
        ])->header('Cache-Control', 'no-store');
    })->middleware('throttle:30,1');
    Route::post('/login', static function (Request $request) {
        $data = $request->validate(['email' => ['required', 'email', 'max:254'], 'password' => ['required', 'string', 'max:72']]);
        $email = trim(strtolower($data['email']));
        $user = DB::table('catalog_staff')->where('email', $email)->where('active', true)->first();
        $fallback = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid = strlen($data['password']) <= 72 && password_verify($data['password'], $user?->password_hash ?? $fallback);
        abort_unless($valid && $user, 422, 'بيانات الدخول غير صحيحة.');

        $request->session()->regenerate();
        $request->session()->forget('customer_id');
        $request->session()->put('catalog_staff', ['email' => $user->email, 'role' => $user->role, 'verified_password' => true, 'version' => hash('sha256', $user->password_hash)]);
        return response()->json(['csrf' => $request->session()->token()]);
    })->middleware('throttle:5,1');
    Route::post('/dispatch-login', static function (Request $request) {
        $data = $request->validate(['email' => ['required', 'email', 'max:254'], 'password' => ['required', 'string', 'max:72']]);
        $email = trim(strtolower($data['email']));
        $user = DB::table('catalog_staff')->where('email', $email)->where('active', true)->first();
        if (!$user) return app(App\Http\Controllers\CustomerAuthController::class)->login($request);
        $fallback = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid = strlen($data['password']) <= 72 && password_verify($data['password'], $user?->password_hash ?? $fallback);
        abort_unless($valid && $user, 422, 'بيانات الدخول غير صحيحة.');

        $request->session()->regenerate();
        $request->session()->put('catalog_staff', ['email' => $user->email, 'role' => $user->role, 'verified_password' => true, 'version' => hash('sha256', $user->password_hash)]);
        return response()->json(['type' => 'staff', 'role' => $user->role, 'csrf' => $request->session()->token()]);
    })->middleware('throttle:5,1');

    Route::post('/logout', static function (Request $request) {
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['csrf' => $request->session()->token()]);
    });

    Route::get('/bundle', static function (Request $request) use ($authorize, $staff) {
        $authorize($request);
        $currentStaff = $staff($request);

        $variants = DB::table('variants')->get()->groupBy('product_id');
        $productsRaw = DB::table('catalog_products')
            ->leftJoin('categories', 'catalog_products.category_slug', '=', 'categories.slug')
            ->whereNotNull('catalog_products.details')
            ->orderBy('catalog_products.id')
            ->get([
                'catalog_products.id',
                'catalog_products.details',
                'catalog_products.category_slug',
                'catalog_products.published',
                'categories.name as category_name',
            ]);
        $products = $productsRaw->map(
            fn ($item) => [
                ...json_decode($item->details, true, flags: JSON_THROW_ON_ERROR),
                'id' => $item->id,
                'categoryId' => $item->category_slug,
                'category' => $item->category_name ?? '',
                'published' => (bool) $item->published,
                'variants' => $variants->get($item->id, collect())->map(fn ($row) => [...(array) $row, 'colorId' => $row->color_key])->values(),
            ]
        );
        $categories = DB::table('categories')->orderBy('name')->get();
        $productTypes = DB::table('product_types')->orderBy('name')->get();

        $ordersRaw = $currentStaff?->role === 'admin' ? DB::table('orders')->orderByDesc('created_at')->limit(50)->get() : collect();
        $orders = $ordersRaw->map(static function ($order): array {
            $lines = json_decode($order->lines, true) ?: [];
            $customer = [];
            try {
                $customer = json_decode(Crypt::decryptString($order->customer), true, flags: JSON_THROW_ON_ERROR);
            } catch (\Throwable) {}
            return [
                'id' => $order->id,
                'total' => (int) $order->total,
                'created_at' => $order->created_at,
                'status' => $order->status ?? 'processing',
                'customer_name' => $customer['name'] ?? 'عميل',
                'customer_phone' => $customer['phone'] ?? '',
                'customer_address' => $customer['address'] ?? '',
                'items_count' => array_sum(array_column($lines, 'quantity')),
                'lines' => $lines,
            ];
        });

        $whatsappQueue = $currentStaff?->role === 'admin' ? DB::table('whatsapp_queue')->orderByDesc('id')->limit(30)->get() : collect();
        $settings = collect(); // Settings are loaded exclusively through the admin-only endpoint.

        return response()->json([
            'session' => [
                'signedIn' => true,
                'role' => $currentStaff?->role,
                'csrf' => $request->session()->token(),
            ],
            'catalog' => [
                'categories' => $categories,
                'products' => $products,
                'productTypes' => $productTypes,
            ],
            'analytics' => $currentStaff?->role === 'admin' ? ['revenue'=>(int)DB::table('orders')->where('status','delivered')->sum('total'),'processing'=>(int)DB::table('orders')->where('status','processing')->count(),'orders'=>(int)DB::table('orders')->count()] : null,
            'orders' => $currentStaff?->role === 'admin' ? $orders : [],
            'whatsappQueue' => $currentStaff?->role === 'admin' ? $whatsappQueue : [],
            'settings' => $settings,
        ])->header('Cache-Control', 'no-store');
    });

    Route::get('/catalog', static function (Request $request) use ($authorize) {
        $authorize($request);
        $variants = DB::table('variants')->get()->groupBy('product_id');
        $products = DB::table('catalog_products')->whereNotNull('details')->orderBy('id')->get()->map(
            fn ($item) => [
                ...json_decode($item->details, true, flags: JSON_THROW_ON_ERROR), 'id' => $item->id,
                'categoryId' => $item->category_slug, 'published' => (bool) $item->published,
                'variants' => $variants->get($item->id, collect())->map(fn ($row) => [...(array) $row, 'colorId' => $row->color_key])->values(),
            ]
        );
        return response()->json(['categories' => DB::table('categories')->orderBy('name')->get(), 'products' => $products, 'productTypes' => DB::table('product_types')->orderBy('name')->get()])
            ->header('Cache-Control', 'no-store');
    });
    Route::get('/orders', static function (Request $request) use ($authorizeAdmin) {
        $authorizeAdmin($request);
        $page=max(1,(int)$request->query('page',1));
        $orders = DB::table('orders')->orderByDesc('created_at')->orderByDesc('id')->offset(($page-1)*50)->limit(50)->get();
        return response()->json($orders->map(static function ($order): array {
            $lines = json_decode($order->lines, true) ?: [];
            $customer = [];
            try {
                $customer = json_decode(Crypt::decryptString($order->customer), true, flags: JSON_THROW_ON_ERROR);
            } catch (\Throwable) {
                // Decrypt fallback
            }
            return [
                'id' => $order->id,
                'total' => (int) $order->total,
                'created_at' => $order->created_at,
                'status' => $order->status ?? 'processing',
                'customer_name' => $customer['name'] ?? 'عميل',
                'customer_phone' => $customer['phone'] ?? '',
                'customer_address' => $customer['address'] ?? '',
                'items_count' => array_sum(array_column($lines, 'quantity')),
                'lines' => $lines,
            ];
        }))->header('Cache-Control', 'no-store')->header('X-Total-Count',(string)DB::table('orders')->count());
    });

    Route::put('/orders/{id}/status', static function (Request $request, string $id) use ($authorize, $staff, $logAudit) {
        $authorize($request);
        $currentStaff = $staff($request);
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['processing', 'shipped', 'delivered', 'cancelled', 'returned'])],
        ]);
        abort_unless($currentStaff?->role === 'admin', 403);
        app(App\Services\OrderLifecycle::class)->transition($id, $data['status'], $currentStaff->email);

        return response()->json(['saved' => true, 'status' => $data['status']]);
    });

    Route::get('/customers', static function (Request $request) use ($authorizeAdmin) {
        $authorizeAdmin($request);
        $page = max(1, (int) $request->query('page', 1));
        $res = \App\Services\CustomerDirectory::paginate($page, 50);
        return response()->json($res['data'])
            ->header('Cache-Control', 'no-store')
            ->header('X-Total-Count', (string) $res['total']);
    });

    Route::post('/products/{id}/toggle-publish', static function (Request $request, string $id) use ($authorize, $staff, $logAudit) {
        $authorize($request);
        $currentStaff = $staff($request);
        $product = DB::table('catalog_products')->where('id', $id)->first();
        abort_unless($product, 404, 'المنتج غير موجود.');

        $newPublished = !$product->published;
        DB::table('catalog_products')->where('id', $id)->update(['published' => $newPublished]);

        $logAudit(
            $currentStaff?->email ?? 'staff',
            'product.visibility_toggled',
            'product',
            $id,
            ['published' => $newPublished],
            $request->ip()
        );

        \App\Http\Controllers\ShopController::bustCatalogCache();
        return response()->json(['published' => $newPublished]);
    });

    Route::delete('/products/{id}', static function (Request $request, string $id) use ($authorize, $staff, $logAudit) {
        $authorize($request);
        $currentStaff = $staff($request);
        abort_unless($currentStaff && $currentStaff->role === 'admin', 403, 'حذف المنتجات مقصور على مسؤول النظام.');

        DB::transaction(static function () use ($id, $currentStaff, $request, $logAudit): void {
            DB::table('variants')->where('product_id', $id)->delete();
            DB::table('collection_product')->where('product_id', $id)->delete();
            DB::table('catalog_products')->where('id', $id)->delete();

            $logAudit(
                $currentStaff->email,
                'product.deleted',
                'product',
                $id,
                ['id' => $id],
                $request->ip()
            );
        });

        \App\Http\Controllers\ShopController::bustCatalogCache();
        return response()->json(['deleted' => true]);
    });

    Route::get('/audit', static function (Request $request) use ($authorize, $staff) {
        $authorize($request);
        abort_unless($staff($request)?->role === 'admin', 403);
        return response()->json(DB::table('audit_events')->orderByDesc('id')->limit(50)->get()->map(function($row){$clean=function($value)use(&$clean){if(!is_array($value))return $value;foreach($value as $key=>$item){if(preg_match('/password|token|secret|csrf|webhook_url/i',(string)$key))unset($value[$key]);else $value[$key]=$clean($item);}return $value;};$row->metadata=json_encode($clean(json_decode($row->metadata??'{}',true)));return $row;}))->header('Cache-Control', 'no-store');
    });

    Route::get('/settings', static function (Request $request) use ($authorize, $staff) {
        $authorize($request);
        $currentStaff = $staff($request);
        abort_unless($currentStaff && $currentStaff->role === 'admin', 403);
        $rows=DB::table('store_settings')->orderBy('key')->get()->map(function($row){
            try { $value = json_decode(Crypt::decryptString($row->value), true, flags: JSON_THROW_ON_ERROR); }
            catch (Throwable) { $value = json_decode($row->value, true, flags: JSON_THROW_ON_ERROR); }
            if ($row->key==='whatsapp'){unset($value['api_token']);}
            $row->value=$value;
            return $row;
        });
        return response()->json($rows)->header('Cache-Control','no-store');
    });

    Route::put('/settings/{key}', static function (Request $request, string $key) use ($authorize, $staff, $logAudit) {
        $authorize($request);
        $currentStaff = $staff($request);
        abort_unless($currentStaff && $currentStaff->role === 'admin', 403);
        $actor = ['email' => $currentStaff->email];
        abort_unless(in_array($key, ['shipping', 'discounts', 'payment_methods', 'whatsapp', 'storefront'], true), 404);
        $data = $request->validate(['value' => ['required', 'array']]);
        $rules=match($key){
          'shipping'=>['fee'=>'required|integer|between:0,1000000','free_threshold'=>'required|integer|between:0,100000000','currency'=>'required|in:EGP','express_available'=>'required|boolean','estimated_days'=>'required|string|max:120'],
          'payment_methods'=>['cash_on_delivery'=>'required|boolean','card'=>'required|boolean','instapay'=>'required|boolean','vodafone_cash'=>'required|boolean'],
          'discounts'=>['*'=>'array:code,percent,min_spend,active','*.code'=>'required|string|max:80|distinct:ignore_case','*.percent'=>'required|integer|between:1,100','*.min_spend'=>'required|integer|between:0,100000000','*.active'=>'required|boolean'],
          'whatsapp'=>['enabled'=>'required|boolean','provider'=>'required|in:manual,direct_link','support_phone'=>'nullable|string|max:20','welcome_message'=>'nullable|string|max:300','webhook_url'=>'nullable|prohibited','api_token'=>'nullable|prohibited','instance_id'=>'nullable|prohibited','auto_confirm'=>'sometimes|boolean'],
          'storefront'=>['announcement_text'=>'required|string|max:300','visit_label'=>'required|string|max:80','location_url'=>'nullable|url|max:500'],
        };
        $data['value']=validator($data['value'],$rules)->validate();
        DB::transaction(static function () use ($key, $data, $actor, $request, $logAudit): void {
            DB::table('store_settings')->updateOrInsert(['key' => $key], ['value' => Crypt::encryptString(json_encode($data['value'], JSON_THROW_ON_ERROR)), 'updated_by' => $actor['email'], 'updated_at' => now()]);
            $logAudit($actor['email'], 'store_setting.updated', 'store_setting', $key, ['key' => $key], $request->ip());
        });
        \App\Http\Controllers\ShopController::bustCatalogCache();
        return response()->json(['saved' => true]);
    });

    Route::post('/product-types', static function (Request $request) use ($authorize) {
        $authorize($request);
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/'],
            'name' => ['required', 'string', 'max:120'],
        ]);
        DB::table('product_types')->upsert([$data], ['slug'], ['name']);

        return response()->json(['saved' => true]);
    });

    // ── WhatsApp Queue endpoints ─────────────────────────────────────
    Route::get('/whatsapp-queue', static function (Request $request) use ($authorizeAdmin) {
        $authorizeAdmin($request);
        return response()->json(
            DB::table('whatsapp_queue')->orderByDesc('id')->limit(50)->get()
        )->header('Cache-Control', 'no-store');
    });

    Route::put('/whatsapp-queue/{id}/mark-sent', static function (Request $request, string $id) use ($authorize, $staff, $logAudit) {
        $authorize($request);
        abort_unless($staff($request)?->role === 'admin',403);
        $currentStaff = $staff($request);
        DB::table('whatsapp_queue')->where('id', $id)->update(['manually_sent' => true]);

        $entry = DB::table('whatsapp_queue')->where('id', $id)->first();
        if ($entry) {
            $logAudit(
                $currentStaff?->email ?? 'staff',
                'whatsapp.manually_sent',
                'order',
                $entry->order_id,
                ['customer_phone' => $entry->customer_phone],
                $request->ip()
            );
        }
        return response()->json(['marked' => true]);
    });

    // ── WhatsApp: send status update to customer ─────────────────────
    Route::post('/whatsapp-notify-status', static function (Request $request) use ($authorize, $staff) {
        $authorize($request);
        abort_unless($staff($request)?->role === 'admin',403);
        $data = $request->validate([
            'order_id' => ['required', 'string'],
            'status'   => ['required', 'string', Rule::in(['shipped', 'delivered', 'cancelled'])],
        ]);
        $order = DB::table('orders')->where('id', $data['order_id'])->first();
        abort_unless($order, 404);

        $customer = [];
        try {
            $customer = json_decode(Crypt::decryptString($order->customer), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {}

        $phone = $customer['phone'] ?? '';
        $name  = $customer['name'] ?? 'عميل';
        abort_unless($phone, 422, 'لا يوجد رقم هاتف للعميل.');

        $message  = \App\Services\WhatsAppService::buildStatusMessage($data['order_id'], $name, $data['status']);
        $sendLink = \App\Services\WhatsAppService::getAdminSendLink($phone, $message);

        // Add to queue
        DB::table('whatsapp_queue')->insert([
            'order_id'       => $data['order_id'],
            'customer_phone' => \App\Services\WhatsAppService::formatPhoneNumber($phone),
            'customer_name'  => $name,
            'message'        => $message,
            'admin_send_url' => $sendLink,
            'auto_sent'      => false,
            'manually_sent'  => false,
            'created_at'     => now(),
        ]);

        return response()->json(['admin_send_url' => $sendLink]);
    });

    Route::post('/categories', static function (Request $request) use ($authorize) {
        $authorize($request);
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/'],
            'name' => ['required', 'string', 'max:120'],
            'editing' => ['required', 'boolean'],
            'parent_slug' => ['present', 'nullable', 'string', Rule::exists('categories', 'slug')],
            'type_slug' => ['present', 'nullable', 'string', Rule::exists('product_types', 'slug')],
        ]);

        DB::transaction(static function () use ($data): void {
            // Serialize tree edits using the locking primitive supported by the configured database.
            $driver = DB::connection()->getDriverName();
            if ($driver === 'pgsql') {
                DB::statement('LOCK TABLE categories IN SHARE ROW EXCLUSIVE MODE');
            } elseif ($driver === 'sqlite') {
                // SQLite acquires its write lock when this harmless update runs, before reading the tree.
                DB::table('categories')->update(['slug' => DB::raw('slug')]);
            } else {
                DB::table('categories')->orderBy('slug')->lockForUpdate()->get(['slug']);
            }
            $parents = DB::table('categories')->pluck('parent_slug', 'slug');
            $exists = $parents->has($data['slug']);
            abort_unless($exists === (bool) $data['editing'], 409, 'التصنيف اتغيّر. حدّث صفحة الإدارة وحاول تاني.');
            unset($data['editing']);
            $seen = [$data['slug'] => true];
            $parent = $data['parent_slug'];
            while ($parent !== null) {
                abort_if(isset($seen[$parent]), 422, 'مينفعش تنقل التصنيف جوّه نفسه أو جوّه أحد فروعه.');
                abort_unless($parents->has($parent), 422, 'القسم الرئيسي غير متاح.');
                $seen[$parent] = true;
                $parent = $parents->get($parent);
            }
            DB::table('categories')->upsert([$data], ['slug'], ['name', 'parent_slug', 'type_slug']);
        });

        return response()->json(['saved' => true]);
    });
    Route::get('/media/limits', static function (Request $request) use ($authorize) {
        $authorize($request);
        return app(App\Http\Controllers\ProductEditorController::class)->limits();
    });

    Route::post('/media', static function (Request $request) use ($authorize) {
        $authorize($request);
        return app(App\Http\Controllers\ProductEditorController::class)->upload($request);
    })->middleware('throttle:120,1');



    Route::post('/products', static function (Request $request) use ($authorize) {
        $authorize($request);
        if ($request->has('colorOptions')) {
            return app(App\Http\Controllers\ProductEditorController::class)->save($request);
        }
        $data = $request->validate([
            'id' => ['nullable', 'string', Rule::exists('catalog_products', 'id')],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1500'],
            'categoryId' => ['required', Rule::exists('categories', 'slug')],
            'price' => ['required', 'integer', 'between:1,100000000'],
            'published' => ['required', 'boolean'],
            'variants' => ['present', 'array', 'list', 'max:15'],
            'variants.*' => ['required', 'array:color,size,stock,expected'],
            'variants.*.color' => ['required', Rule::in(['أسود', 'رمادي', 'أبيض'])],
            'variants.*.size' => ['required', Rule::in(['M', 'L', 'XL', '2XL', '3XL'])],
            'variants.*.stock' => ['required', 'integer', 'between:0,1000000'],
            'variants.*.expected' => ['present', 'nullable', 'integer', 'between:0,1000000'],
        ]);
        $id = $data['id'] ?? (string) Str::uuid();
        DB::transaction(static function () use ($data, $id): void {
            $existing = DB::table('catalog_products')->where('id', $id)->lockForUpdate()->first();
            $details = $existing ? json_decode($existing->details, true, flags: JSON_THROW_ON_ERROR) : [];
            DB::table('catalog_products')->updateOrInsert(['id' => $id], [
                'category_slug' => $data['categoryId'], 'published' => $data['published'],
                'details' => json_encode([
                    ...$details, 'id' => $id, 'name' => $data['name'], 'description' => $data['description'] ?? '',
                    'price' => (int) $data['price'], 'label' => $details['label'] ?? '',
                    'fit' => $details['fit'] ?? '', 'image' => $details['image'] ?? '',
                ], JSON_THROW_ON_ERROR),
            ]);
            foreach ($data['variants'] as $variant) {
                $colorIndex = array_search($variant['color'], ['أسود', 'رمادي', 'أبيض'], true);
                $sku = $id.'-'.$colorIndex.'-'.$variant['size'];
                $existingStock = DB::table('variants')->where('sku', $sku)->lockForUpdate()->value('stock');
                $expectedStock = $variant['expected'];
                abort_unless(
                    ($existingStock === null ? null : (int) $existingStock) === ($expectedStock === null ? null : (int) $expectedStock),
                    409,
                    'المخزون اتغيّر بعد فتح المنتج. ارجع للقائمة وافتحه تاني قبل الحفظ.'
                );
                unset($variant['expected']);
                DB::table('variants')->updateOrInsert(['sku' => $sku], ['product_id' => $id, ...$variant]);
            }
        });
        \App\Http\Controllers\ShopController::bustCatalogCache();
        return response()->json(['id' => $id]);
    });
});




Route::get('/media/{id}', static function (Request $request, string $id) {
    $file = DB::table('product_media')->where('id', $id)->first();
    abort_unless($file, 404);
    $public = $file->product_id && DB::table('catalog_products')->where('id', $file->product_id)->where('published', true)->exists();
    if (!$public) {
        $login = $request->session()->get('catalog_staff');
        $user = is_array($login) && ($login['verified_password'] ?? false) === true ? DB::table('catalog_staff')->where('email', $login['email'])->where('active', true)->whereIn('role', ['catalog_manager', 'admin'])->first() : null;
        abort_unless($user && hash_equals(hash('sha256', $user->password_hash), $login['version'])
            && ($file->product_id || $file->owner === $user->email), 404);
    }
    $path = storage_path('app/product-media/'.$file->id.'.'.$file->extension);
    abort_unless(is_file($path), 404);
    return response()->file($path, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
})->whereUuid('id');


Route::get('/customer/session',[App\Http\Controllers\CustomerAuthController::class,'session'])->middleware('throttle:session');
Route::post('/customer/register',[App\Http\Controllers\CustomerAuthController::class,'register'])->middleware('throttle:auth');

Route::post('/customer/login',[App\Http\Controllers\CustomerAuthController::class,'login'])->middleware('throttle:auth');

Route::post('/checkout/quote',function(Request $r){$d=$r->validate(['items'=>'required|array|min:1|max:20','items.*.sku'=>'required|string|max:80','items.*.quantity'=>'required|integer|between:1,10','discount_code'=>'nullable|string|max:80']);$total=0;foreach($d['items'] as $line){$p=DB::table('variants')->join('catalog_products','variants.product_id','=','catalog_products.id')->where('sku',$line['sku'])->where('published',true)->value('details');abort_unless($p,422,'Product unavailable.');$total+=json_decode($p,true,flags:JSON_THROW_ON_ERROR)['price']*$line['quantity'];}return response()->json(App\Services\CheckoutPricing::quote($total,'cod',$d['discount_code']??''))->header('Cache-Control','no-store');})->middleware('throttle:quote');
