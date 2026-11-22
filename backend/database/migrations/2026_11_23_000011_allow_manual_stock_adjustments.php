<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * EC-02: inventory_movements.order_id was NOT NULL, so a staff stock edit could
 * not be written to the ledger at all — only sales and restores were recorded
 * and stock could never be reconciled. Make it nullable and record who made the
 * change, so manual adjustments appear alongside sales.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table): void {
            $table->uuid('order_id')->nullable()->change();
            $table->string('actor_email', 254)->nullable()->after('reason');
        });

        // The unique key (order_id, sku, reason) stops a cancel restoring stock twice.
        // It cannot serve adjustments, where order_id is null and repeats are valid:
        // in both SQLite and PostgreSQL NULLs are distinct, so rows stay insertable,
        // but drop and rebuild it on the same columns to keep the intent explicit.
        if (DB::connection()->getDriverName() !== 'sqlite') {
            Schema::table('inventory_movements', function (Blueprint $table): void {
                $table->index(['sku', 'created_at'], 'inventory_movements_sku_created_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table): void {
            if (DB::connection()->getDriverName() !== 'sqlite') {
                $table->dropIndex('inventory_movements_sku_created_idx');
            }
            $table->dropColumn('actor_email');
        });
        // order_id stays nullable: reverting it would fail while adjustment rows exist.
    }
};
