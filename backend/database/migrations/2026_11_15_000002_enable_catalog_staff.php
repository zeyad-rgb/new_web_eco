<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('catalog_staff', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('password_hash');
            $table->string('role');
        });
        Schema::table('catalog_products', function (Blueprint $table): void {
            $table->json('details')->nullable();
            $table->boolean('published')->default(false);
        });
        $products = json_decode(file_get_contents(base_path('../frontend/public/products.json')), true, flags: JSON_THROW_ON_ERROR);
        foreach ($products as $product) {
            DB::table('catalog_products')->where('id', $product['id'])->update([
                'details' => json_encode($product, JSON_THROW_ON_ERROR), 'published' => true,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('catalog_products', fn (Blueprint $table) => $table->dropColumn(['details', 'published']));
        Schema::dropIfExists('catalog_staff');
    }
};
