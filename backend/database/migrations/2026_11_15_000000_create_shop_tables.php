<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('variants', function (Blueprint $table): void {
            $table->string('sku', 80)->primary();
            $table->string('product_id')->index();
            $table->string('color');
            $table->string('size');
            $table->unsignedInteger('stock');
        });
        Schema::create('orders', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('request_id')->unique();
            $table->string('fingerprint', 64);
            $table->text('customer');
            $table->json('lines');
            $table->unsignedInteger('total');
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
        Schema::dropIfExists('variants');
    }
};
