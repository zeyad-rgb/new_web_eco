<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
 Schema::create('customers', function(Blueprint $t){$t->uuid('id')->primary();$t->string('name',120);$t->string('email',254)->unique();$t->string('phone',20);$t->string('password_hash');$t->timestamps();});
 Schema::table('orders', function(Blueprint $t){$t->uuid('customer_id')->nullable()->index();$t->unsignedInteger('subtotal')->default(0);$t->unsignedInteger('shipping_fee')->default(0);$t->unsignedInteger('discount')->default(0);$t->string('payment_method',30)->default('cod');$t->string('payment_status',30)->default('unpaid');$t->string('discount_code',80)->nullable();});
 Schema::create('inventory_movements',function(Blueprint $t){$t->id();$t->string('sku',80)->index();$t->uuid('order_id')->index();$t->integer('quantity');$t->string('reason',40);$t->timestamp('created_at');$t->unique(['order_id','sku','reason']);});
 Schema::create('jobs',function(Blueprint $t){$t->bigIncrements('id');$t->string('queue')->index();$t->longText('payload');$t->unsignedTinyInteger('attempts');$t->unsignedInteger('reserved_at')->nullable();$t->unsignedInteger('available_at');$t->unsignedInteger('created_at');});
 Schema::create('failed_jobs',function(Blueprint $t){$t->id();$t->string('uuid')->unique();$t->text('connection');$t->text('queue');$t->longText('payload');$t->longText('exception');$t->timestamp('failed_at')->useCurrent();});
 }
 public function down():void {Schema::dropIfExists('failed_jobs');Schema::dropIfExists('jobs');Schema::dropIfExists('inventory_movements');Schema::table('orders',fn(Blueprint $t)=>$t->dropColumn(['customer_id','subtotal','shipping_fee','discount','payment_method','payment_status','discount_code']));Schema::dropIfExists('customers');}
};
