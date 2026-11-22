<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\ShopController;
final class OrderLifecycle {
 public function transition(string $id,string $next,string $actor): void {
 DB::transaction(function()use($id,$next,$actor){
 $o=DB::table('orders')->where('id',$id)->lockForUpdate()->first();abort_unless($o,404);$old=$o->status;
 if($old===$next)return;
 $allowed=['processing'=>['shipped','cancelled'],'shipped'=>['delivered','returned'],'delivered'=>['returned'],'cancelled'=>[],'returned'=>[]];
 abort_unless(in_array($next,$allowed[$old]??[],true),409,'Invalid order status transition.');
 if(in_array($next,['cancelled','returned'],true))foreach(json_decode($o->lines,true,flags:JSON_THROW_ON_ERROR) as $l){
 abort_unless(DB::table('variants')->where('sku',$l['sku'])->increment('stock',$l['quantity'])===1,409,'Variant missing; inventory review required.');
 DB::table('inventory_movements')->insert(['sku'=>$l['sku'],'order_id'=>$id,'quantity'=>$l['quantity'],'reason'=>'restore','created_at'=>now()]);
 }
 DB::table('orders')->where('id',$id)->update(['status'=>$next]);
 DB::table('audit_events')->insert(['actor_email'=>$actor,'event'=>'order.status_updated','subject_type'=>'order','subject_id'=>$id,'metadata'=>json_encode(['old'=>$old,'new'=>$next]),'created_at'=>now()]);
 DB::afterCommit(fn()=>ShopController::bustCatalogCache());
 },3);
 }
}
