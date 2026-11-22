<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        foreach (['categories', 'collections'] as $name) {
            Schema::create($name, function (Blueprint $table): void {
                $table->string('slug', 80)->primary();
                $table->string('name', 120);
            });
        }

        Schema::create('catalog_products', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('category_slug', 80)->nullable()->index();
            $table->foreign('category_slug')->references('slug')->on('categories')->nullOnDelete();
        });

        Schema::create('collection_product', function (Blueprint $table): void {
            $table->string('collection_slug', 80);
            $table->string('product_id');
            $table->primary(['collection_slug', 'product_id']);
            $table->foreign('collection_slug')->references('slug')->on('collections')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('catalog_products')->cascadeOnDelete();
            $table->index('product_id');
        });

        $products = json_decode(file_get_contents(base_path('../frontend/public/products.json')), true, flags: JSON_THROW_ON_ERROR);
        foreach ($products as $product) {
            DB::table('categories')->insertOrIgnore(['slug' => $product['categoryId'], 'name' => $product['category']]);
            DB::table('catalog_products')->insert(['id' => $product['id'], 'category_slug' => $product['categoryId']]);
        }
        foreach (['training' => 'مجموعة التمرين', 'everyday' => 'الأساسيات اليومية', 'latest' => 'وصل حديثًا'] as $slug => $name) {
            DB::table('collections')->insert(['slug' => $slug, 'name' => $name]);
        }
        foreach ($products as $product) {
            foreach ($product['collections'] as $slug) {
                DB::table('collection_product')->insert(['collection_slug' => $slug, 'product_id' => $product['id']]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_product');
        Schema::dropIfExists('catalog_products');
        Schema::dropIfExists('collections');
        Schema::dropIfExists('categories');
    }
};
