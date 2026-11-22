<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
final class CustomerAuthController {
 private function profile(object $u): array {return ['id'=>$u->id,'name'=>$u->name,'email'=>$u->email,'phone'=>$u->phone,'role'=>'customer','points'=>0,'clubTier'=>'member','joinedDate'=>$u->created_at];}
 public function session(Request $r){$u=DB::table('customers')->where('id',$r->session()->get('customer_id'))->first();return response()->json(['user'=>$u?$this->profile($u):null,'csrf'=>$r->session()->token()])->header('Cache-Control','no-store');}
 public function register(Request $r){$d=$r->validate(['name'=>'required|string|max:120','email'=>'required|email|max:254','phone'=>['required','regex:/\A01[0125][0-9]{8}\z/'],'password'=>'required|string|min:12|max:72']);$d['email']=strtolower(trim($d['email']));abort_if(DB::table('customers')->where('email',$d['email'])->exists() || DB::table('catalog_staff')->where('email',$d['email'])->exists(),422,'Email cannot be registered.');$id=(string)Str::uuid();DB::table('customers')->insert(['id'=>$id,'name'=>$d['name'],'email'=>$d['email'],'phone'=>$d['phone'],'password_hash'=>Hash::make($d['password']),'created_at'=>now(),'updated_at'=>now()]);$r->session()->regenerate();$r->session()->forget('catalog_staff');$r->session()->put('customer_id',$id);return $this->session($r);}
 /** The signed-in customer's own orders (newest 20). No contact details: those stay encrypted in orders.customer. */
 public function orders(Request $r){$id=$r->session()->get('customer_id');abort_unless($id && DB::table('customers')->where('id',$id)->exists(),401,'Sign in to see your orders.');
  $orders=DB::table('orders')->where('customer_id',$id)->orderByDesc('created_at')->limit(20)->get(['id','created_at','status','total','lines'])->map(function($o){$lines=json_decode($o->lines,true)?:[];return ['id'=>$o->id,'created_at'=>$o->created_at,'status'=>$o->status??'processing','total'=>(int)$o->total,'items_count'=>array_sum(array_map(fn($l)=>(int)($l['quantity']??0),$lines))];});
  return response()->json(['orders'=>$orders->values()])->header('Cache-Control','no-store');}
 public function login(Request $r){$d=$r->validate(['email'=>'required|email|max:254','password'=>'required|string|max:72']);$u=DB::table('customers')->where('email',strtolower(trim($d['email'])))->first();$fallback='$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';abort_unless(password_verify($d['password'],$u?->password_hash??$fallback)&&$u,422,'Invalid email or password.');$r->session()->regenerate();$r->session()->forget('catalog_staff');$r->session()->put('customer_id',$u->id);return response()->json(['type'=>'customer','user'=>$this->profile($u),'csrf'=>$r->session()->token()])->header('Cache-Control','no-store');}
}
