<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {if(Schema::hasTable('whatsapp_queue'))return;Schema::create('whatsapp_queue',function(Blueprint $t){$t->id();$t->uuid('order_id');$t->string('customer_phone',20);$t->string('customer_name')->default('');$t->text('message');$t->text('admin_send_url');$t->boolean('auto_sent')->default(false);$t->boolean('manually_sent')->default(false);$t->timestamp('created_at')->nullable();});}
 public function down():void {Schema::dropIfExists('whatsapp_queue');}
};
