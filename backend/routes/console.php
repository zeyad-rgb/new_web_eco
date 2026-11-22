<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

// Hostinger Shared Hosting Queue Worker Task
// Runs every minute, processes all queued jobs (orders, WhatsApp notifications, cache busting) and exits cleanly.
Schedule::command('queue:work --stop-when-empty --tries=3 --max-time=50')
    ->everyMinute()
    ->withoutOverlapping();

Artisan::command('catalog:group {kind} {slug} {name} {products?*}', function (): int {
    $kind = $this->argument('kind');
    $slug = $this->argument('slug');
    $name = trim($this->argument('name'));
    $products = array_values(array_unique($this->argument('products')));

    if (!in_array($kind, ['category', 'collection'], true)
        || !preg_match('/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/', $slug)
        || strlen($slug) > 80 || $name === '' || mb_strlen($name) > 120) {
        $this->error('Use category or collection, a valid slug and a name of up to 120 characters.');
        return 1;
    }

    if (DB::table('catalog_products')->whereIn('id', $products)->count() !== count($products)) {
        $this->error('One or more product IDs do not exist.');
        return 1;
    }

    DB::transaction(function () use ($kind, $slug, $name, $products): void {
        if ($kind === 'category') {
            DB::table('categories')->upsert([['slug' => $slug, 'name' => $name]], ['slug'], ['name']);
            DB::table('catalog_products')->whereIn('id', $products)->update(['category_slug' => $slug]);
            return;
        }

        DB::table('collections')->upsert([['slug' => $slug, 'name' => $name]], ['slug'], ['name']);
        foreach ($products as $id) {
            DB::table('collection_product')->insertOrIgnore(['collection_slug' => $slug, 'product_id' => $id]);
        }
    });

    $this->info('Catalog group saved.');
    return 0;
})->purpose('Create or rename a category or collection and optionally assign products');

Artisan::command('catalog:staff {email}', function (): int {
    $email = strtolower(trim($this->argument('email')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        $this->error('Enter a valid email.');
        return 1;
    }
    $password = $this->secret('Password (16–72 bytes)');
    if (!is_string($password) || strlen($password) < 16 || strlen($password) > 72) {
        $this->error('Password length must be 16–72 bytes.');
        return 1;
    }
    DB::table('catalog_staff')->upsert([[
        'email' => $email, 'password_hash' => Illuminate\Support\Facades\Hash::make($password),
        'role' => 'catalog_manager',
    ]], ['email'], ['password_hash', 'role']);
    $this->info('Catalog manager saved.');
    return 0;
});


Artisan::command('security:admin {email}', function (): int {
    $email = strtolower(trim($this->argument('email')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) { $this->error('Enter a valid email.'); return 1; }
    $password = $this->secret('Admin password (16-72 bytes)');
    if (!is_string($password) || strlen($password) < 16 || strlen($password) > 72) { $this->error('Password length must be 16-72 bytes.'); return 1; }
    DB::table('catalog_staff')->upsert([['email' => $email, 'password_hash' => Illuminate\Support\Facades\Hash::make($password), 'role' => 'admin', 'active' => true]], ['email'], ['password_hash', 'role', 'active']);
    $this->info('Admin provisioned.'); return 0;
})->purpose('Provision an administrator from a trusted local console');

Artisan::command('security:readiness',function():int { $bad=[];foreach(['app.key','database.default','cache.default','queue.default'] as $key)if(!config($key))$bad[]=$key.' is missing';if(config('app.debug'))$bad[]='Debug is enabled';if(config('app.env')!=='production')$bad[]='APP_ENV is not production';if(config('database.default')==='sqlite')$bad[]='SQLite is configured';if(!config('session.secure'))$bad[]='Secure session cookies are disabled';if(config('cache.default')!=='redis')$bad[]='Shared Redis cache is not enabled';if($bad){foreach($bad as $message)$this->error($message);return 1;}$this->info('Configuration checks passed; load testing and restore verification are still required.');return 0;});
Artisan::command('media:cleanup {--delete}',function():int {$rows=DB::table('product_media')->whereNull('product_id')->where('created_at','<',now()->subDays(7))->get();$this->info($rows->count().' unattached uploads older than seven days.');if(!$this->option('delete'))return 0;foreach($rows as $row){$path=storage_path('app/product-media/'.$row->id.'.'.$row->extension);if(is_file($path)&&!unlink($path))continue;DB::table('product_media')->where('id',$row->id)->whereNull('product_id')->delete();}return 0;});
