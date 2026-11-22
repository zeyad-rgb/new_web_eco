<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('catalog_products', static function (Blueprint $table): void {
            if (!Schema::hasIndex($table->getTable(), 'idx_catalog_products_published')) $table->index('published', 'idx_catalog_products_published');
        });

        Schema::table('orders', static function (Blueprint $table): void {
            if (!Schema::hasIndex($table->getTable(), 'idx_orders_created_at')) $table->index('created_at', 'idx_orders_created_at');
            if (!Schema::hasIndex($table->getTable(), 'idx_orders_status')) $table->index('status', 'idx_orders_status');
        });

        if (Schema::hasTable('whatsapp_queue')) {
            Schema::table('whatsapp_queue', static function (Blueprint $table): void {
                if (!Schema::hasIndex($table->getTable(), 'idx_whatsapp_queue_order_id')) $table->index('order_id', 'idx_whatsapp_queue_order_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('catalog_products', static function (Blueprint $table): void {
            $table->dropIndex('idx_catalog_products_published');
        });

        Schema::table('orders', static function (Blueprint $table): void {
            $table->dropIndex('idx_orders_created_at');
            $table->dropIndex('idx_orders_status');
        });

        if (Schema::hasTable('whatsapp_queue')) {
            Schema::table('whatsapp_queue', static function (Blueprint $table): void {
                $table->dropIndex('idx_whatsapp_queue_order_id');
            });
        }
    }
};
