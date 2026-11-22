<?php
namespace App\Jobs;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
final class SendOrderConfirmation implements ShouldQueue {
 use Queueable;
 public int $tries=3;
 public int $timeout=30;
 public function __construct(public string $orderId){}
 public function handle():void {$o=DB::table('orders')->where('id',$this->orderId)->first();if(!$o)return;$c=json_decode(Crypt::decryptString($o->customer),true,flags:JSON_THROW_ON_ERROR);\App\Services\WhatsAppService::dispatchOrderConfirmation($o->id,$c['phone'],$c['name'],$c['address'],(int)$o->total,json_decode($o->lines,true,flags:JSON_THROW_ON_ERROR));}
}
