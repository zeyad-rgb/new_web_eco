<?php
namespace App\Services;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
final class CheckoutPricing {
 public static function setting(string $key,array $default=[]):array {
  $v=DB::table('store_settings')->where('key',$key)->value('value');
  if (!$v) return $default;
  try {
   $json = Crypt::decryptString($v);
  } catch (\Throwable) {
   // Backward compatibility for settings written before encryption was enabled.
   $json = $v;
  }
  return json_decode($json,true,flags:JSON_THROW_ON_ERROR) ?: $default;
 }
 public static function quote(int $subtotal,string $method='cod',string $code=''):array {
 $payments=self::setting('payment_methods',['cash_on_delivery'=>true]);
 // External payment methods require verified gateway/webhook integration before activation.
 abort_unless($method==='cod'&&($payments['cash_on_delivery']??true),422,'Payment method is not available.');
 $s=self::setting('shipping',['fee'=>8500,'free_threshold'=>0]);$fee=(int)($s['fee']??8500);$threshold=(int)($s['free_threshold']??0);if($threshold>0&&$subtotal>=$threshold)$fee=0;
 $discount=0;$code=strtoupper(trim($code));
 if($code!==''){ $rule=collect(self::setting('discounts'))->first(fn($d)=>strtoupper($d['code']??'')===$code&&($d['active']??false));abort_unless($rule&&$subtotal>=(int)($rule['min_spend']??0),422,'Invalid discount code.');$discount=(int)round($subtotal*min(100,max(0,(int)$rule['percent']))/100); }
 return ['subtotal'=>$subtotal,'shipping_fee'=>$fee,'discount'=>$discount,'total'=>$subtotal+$fee-$discount,'payment_method'=>$method,'discount_code'=>$code?:null];
 }
}
