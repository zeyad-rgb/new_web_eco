<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('variants', function (Blueprint $table): void {
            $table->uuid('color_key')->nullable();
        });
        Schema::create('product_media', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('owner', 254);
            $table->string('product_id')->nullable()->index();
            $table->foreign('product_id')->references('id')->on('catalog_products')->cascadeOnDelete();
            $table->string('extension', 4);
            $table->timestamp('created_at');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('product_media');
        Schema::table('variants', fn (Blueprint $table) => $table->dropColumn('color_key'));
    }
};
