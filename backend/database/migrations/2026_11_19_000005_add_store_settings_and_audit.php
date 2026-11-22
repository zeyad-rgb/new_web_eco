<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('store_settings', function (Blueprint $table): void { $table->string('key',100)->primary(); $table->json('value'); $table->string('updated_by',254)->nullable(); $table->timestamp('updated_at'); });
  Schema::create('audit_events', function (Blueprint $table): void { $table->bigIncrements('id'); $table->string('actor_email',254)->nullable(); $table->string('event',100); $table->string('subject_type',100)->nullable(); $table->string('subject_id',100)->nullable(); $table->json('metadata')->nullable(); $table->string('ip_address',45)->nullable(); $table->timestamp('created_at'); $table->index(['subject_type','subject_id']); $table->index('created_at'); });
  Schema::table('catalog_staff', function (Blueprint $table): void { $table->boolean('mfa_required')->default(false); $table->boolean('active')->default(true); });
 }
 public function down(): void { Schema::table('catalog_staff', fn (Blueprint $table) => $table->dropColumn(['mfa_required','active'])); Schema::dropIfExists('audit_events'); Schema::dropIfExists('store_settings'); }
};
