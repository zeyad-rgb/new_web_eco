<?php
// Isolated regression checks: SQLite in memory; never touches the store database.
require __DIR__.'/../vendor/autoload.php';
$app=require __DIR__.'/../bootstrap/app.php';
$testStorage=sys_get_temp_dir().'/studio-regression-'.bin2hex(random_bytes(6));
mkdir($testStorage,0755,true);
$app->useStoragePath($testStorage);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function(Throwable $e){fwrite(STDERR,$e->getMessage().PHP_EOL);exit(1);});
$app->detectEnvironment(fn()=> 'testing');
$app['config']->set(['app.env'=>'testing','database.default'=>'sqlite','database.connections.sqlite.database'=>':memory:','cache.default'=>'array','session.driver'=>'array','queue.default'=>'database']);
Illuminate\Support\Facades\DB::purge('sqlite');
Illuminate\Support\Facades\Artisan::call('migrate',['--force'=>true]);
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
$checks=0;
function check(bool $ok,string $label):void{global $checks;if(!$ok)throw new RuntimeException($label);$checks++;echo "PASS ".$label.PHP_EOL;}
$cookies=[];
function req(string $method,string $path,array $data=[],array $files=[]){global $app,$cookies;$r=Illuminate\Http\Request::create($path,$method,$files?$data:[],$cookies,$files,['REMOTE_ADDR'=>'192.0.2.'.random_int(1,250),'HTTP_ACCEPT'=>'application/json','CONTENT_TYPE'=>$files?'multipart/form-data':'application/json'],$files?null:json_encode($data));$response=$app->make(Illuminate\Contracts\Http\Kernel::class)->handle($r);foreach($response->headers->getCookies() as $cookie)$cookies[$cookie->getName()]=$cookie->getValue();return $response;}
DB::table('catalog_staff')->insert(['email'=>'zeyadmahmoud159@gmail.com','password_hash'=>Hash::make('Correct-password-123!'),'role'=>'admin','active'=>true,'mfa_required'=>false]);
$hash=DB::table('catalog_staff')->value('password_hash');
foreach(['/staff/login','/staff/dispatch-login'] as $path) check(req('POST',$path,['email'=>'zeyadmahmoud159@gmail.com','password'=>'wrong-password'])->getStatusCode()===422,'wrong owner password rejected '.$path);
check(DB::table('catalog_staff')->value('password_hash')===$hash,'failed login never changes password');
check(req('GET','/staff/bundle')->getStatusCode()===403,'anonymous admin bundle rejected');
check(req('POST','/customer/register',['name'=>'Test','email'=>'test@example.com','phone'=>'01012345678','password'=>'Secure-password-123!','role'=>'admin'])->getStatusCode()===200,'customer registration');
check(DB::table('customers')->where('email','test@example.com')->exists(),'customer persisted');
check(!DB::table('catalog_staff')->where('email','test@example.com')->exists(),'registration cannot grant staff role');
check(req('POST','/customer/login',['email'=>'test@example.com','password'=>'bad'])->getStatusCode()===422,'wrong customer password rejected');
DB::table('store_settings')->insert(['key'=>'shipping','value'=>json_encode(['fee'=>5000,'free_threshold'=>100000]),'updated_at'=>now()]);
DB::table('store_settings')->insert(['key'=>'discounts','value'=>json_encode([['code'=>'TEST10','percent'=>10,'min_spend'=>1000,'active'=>true]]),'updated_at'=>now()]);
$q=App\Services\CheckoutPricing::quote(20000,'cod','TEST10');check($q['total']===23000,'server shipping and discount pricing');
check(App\Services\CheckoutPricing::quote(100000)['shipping_fee']===0,'free shipping threshold');
DB::table('variants')->insert(['sku'=>'test-sku','product_id'=>'training-tee','color'=>'Black','size'=>'M','stock'=>5]);
$payload=['request_id'=>(string)Illuminate\Support\Str::uuid(),'name'=>'Test','phone'=>'01012345678','address'=>'Cairo test address','items'=>[['sku'=>'test-sku','quantity'=>2]]];
$r=req('POST','/api/v1/orders',$payload);if($r->getStatusCode()!==201) echo $r->getStatusCode().' '.$r->getContent().PHP_EOL;check($r->getStatusCode()===201,'order saved');$id=json_decode($r->getContent(),true)['id'];
check(DB::table('variants')->where('sku','test-sku')->value('stock')===3,'stock decremented');
check(DB::table('jobs')->count()===1,'notification queued');
check(req('POST','/api/v1/orders',$payload)->getStatusCode()===200,'idempotent order retry');
check(DB::table('variants')->where('sku','test-sku')->value('stock')===3,'retry cannot decrement twice');
$life=new App\Services\OrderLifecycle();$life->transition($id,'cancelled','test-admin');$life->transition($id,'cancelled','test-admin');
check(DB::table('variants')->where('sku','test-sku')->value('stock')===5,'cancel restores once');
try{$life->transition($id,'shipped','test-admin');throw new RuntimeException('invalid transition accepted');}catch(Symfony\Component\HttpKernel\Exception\HttpException $e){check($e->getStatusCode()===409,'cancelled order cannot ship');}
$bad=$payload;$bad['request_id']=(string)Illuminate\Support\Str::uuid();$bad['items'][0]['quantity']=10;check(req('POST','/api/v1/orders',$bad)->getStatusCode()===409,'overselling rejected');
check(DB::table('orders')->count()===1,'failed checkout rolls back order');
DB::table('catalog_staff')->insert(['email'=>'manager@example.com','password_hash'=>Hash::make('Manager-password-123!'),'role'=>'catalog_manager','active'=>true,'mfa_required'=>false]);
check(req('POST','/staff/dispatch-login',['email'=>'manager@example.com','password'=>'Manager-password-123!'])->getStatusCode()===200,'manager valid login');
check(req('GET','/staff/settings')->getStatusCode()===403,'manager cannot read settings');
check(req('GET','/staff/orders')->getStatusCode()===403,'manager cannot read customer orders');
$bundle=req('GET','/staff/bundle');$bundleData=json_decode($bundle->getContent(),true);check($bundle->getStatusCode()===200 && $bundleData['settings']===[] && $bundleData['orders']===[],'manager bundle has no protected data');
$upload=req('POST','/staff/media',[],['image'=>Illuminate\Http\UploadedFile::fake()->image('sample.jpg',600,800)]);
check($upload->getStatusCode()===201,'manager uploads product image');
$url=json_decode($upload->getContent(),true)['url'];$mediaId=substr($url,7);
check(is_file(storage_path('app/product-media/'.$mediaId.'.webp')),'image stored as WebP');
$colorId=(string)Illuminate\Support\Str::uuid();
$productData=['id'=>null,'name'=>'Image integration product','description'=>'Test image','categoryId'=>DB::table('categories')->whereNotNull('parent_slug')->value('slug'),'price'=>59900,'published'=>false,'colorOptions'=>[['id'=>$colorId,'name'=>'Black','hex'=>'#222222','images'=>[$url]]],'sizeOptions'=>['M'],'variants'=>[['colorId'=>$colorId,'size'=>'M','stock'=>7]],'originalVariants'=>[]];
$save=req('POST','/staff/products',$productData);check($save->getStatusCode()===200,'product saved with uploaded image');
$productId=json_decode($save->getContent(),true)['id'];
check(DB::table('product_media')->where('id',$mediaId)->value('product_id')===$productId,'image linked to product');
check(DB::table('variants')->where('product_id',$productId)->value('stock')===7,'new product stock persisted');
$badUpload=req('POST','/staff/media',[],['image'=>Illuminate\Http\UploadedFile::fake()->create('payload.php',1,'application/x-php')]);check($badUpload->getStatusCode()===422,'executable upload rejected');
check(req('POST','/staff/products/'.$productId.'/toggle-publish')->getStatusCode()===200,'product publish succeeds');
$public=json_decode(req('GET','/api/v1/products')->getContent(),true);$found=collect($public['products'])->firstWhere('id',$productId);
check($found && $found['images']===[$url] && $found['price']===59900,'published catalog contains image and correct price');
check(req('GET',$url)->getStatusCode()===200,'saved image is served');
unlink(storage_path('app/product-media/'.$mediaId.'.webp'));
check(req('POST','/staff/dispatch-login',['email'=>'zeyadmahmoud159@gmail.com','password'=>'Correct-password-123!'])->getStatusCode()===200,'admin valid login');
check(req('GET','/staff/settings')->getStatusCode()===200,'admin settings accessible');
check(req('PUT','/staff/settings/shipping',['value'=>['fee'=>-1]])->getStatusCode()===422,'invalid settings rejected');
$custRes = req('GET','/staff/customers');
check($custRes->getStatusCode()===200,'admin customers directory accessible');
$custData = json_decode($custRes->getContent(), true);
check(is_array($custData) && count($custData) >= 1,'customers returned from orders');
check(DB::table('jobs')->count()===1,'idempotent retry creates no duplicate jobs');
// SEC-01: admin-only endpoints must use the current DB role, not the role cached in the session at login.
DB::table('catalog_staff')->insert(['email'=>'demoted-admin@example.test','password_hash'=>Hash::make('Demoted-password-123!'),'role'=>'admin','active'=>true,'mfa_required'=>false]);
check(req('POST','/staff/dispatch-login',['email'=>'demoted-admin@example.test','password'=>'Demoted-password-123!'])->getStatusCode()===200,'second admin valid login');
$adminOnly=['/staff/orders','/staff/customers','/staff/whatsapp-queue','/staff/settings','/staff/audit'];
foreach($adminOnly as $path) check(req('GET',$path)->getStatusCode()===200,'admin reads '.$path);
DB::table('catalog_staff')->where('email','demoted-admin@example.test')->update(['role'=>'catalog_manager']);
foreach($adminOnly as $path) check(req('GET',$path)->getStatusCode()===403,'demoted admin loses '.$path);
$demotedBundle=json_decode(req('GET','/staff/bundle')->getContent(),true);
check($demotedBundle['orders']===[] && $demotedBundle['whatsappQueue']===[],'demoted admin bundle hides orders');
// CUST-06: customers see only their own orders, without contact details.
req('POST','/staff/logout');
check(req('GET','/customer/orders')->getStatusCode()===401,'anonymous cannot list customer orders');
DB::table('variants')->insert(['sku'=>'cust-sku','product_id'=>'training-tee','color'=>'Black','size'=>'L','stock'=>5]);
check(req('POST','/customer/register',['name'=>'Customer A','email'=>'customer-a@example.test','phone'=>'01011111111','password'=>'Customer-a-pass-123!'])->getStatusCode()===200,'customer A registers');
$ownOrder=req('POST','/api/v1/orders',['request_id'=>(string)Illuminate\Support\Str::uuid(),'name'=>'Customer A','phone'=>'01011111111','address'=>'Cairo customer A street','items'=>[['sku'=>'cust-sku','quantity'=>2]]]);
check($ownOrder->getStatusCode()===201,'customer A places an order');$ownOrderId=json_decode($ownOrder->getContent(),true)['id'];
$listA=json_decode(req('GET','/customer/orders')->getContent(),true);
check(count($listA['orders'])===1 && $listA['orders'][0]['id']===$ownOrderId && $listA['orders'][0]['items_count']===2 && $listA['orders'][0]['status']==='processing','customer A sees own order');
check(!str_contains(json_encode($listA),'01011111111') && !str_contains(json_encode($listA),'Cairo customer A'),'order list has no contact details');
req('POST','/staff/logout');
check(req('POST','/customer/register',['name'=>'Customer B','email'=>'customer-b@example.test','phone'=>'01022222222','password'=>'Customer-b-pass-123!'])->getStatusCode()===200,'customer B registers');
check(json_decode(req('GET','/customer/orders')->getContent(),true)['orders']===[],'customer B cannot see customer A orders');
// ADM-03: a product that has sold must not be hard-deleted (old orders could no longer be cancelled/returned).
check(req('POST','/staff/dispatch-login',['email'=>'zeyadmahmoud159@gmail.com','password'=>'Correct-password-123!'])->getStatusCode()===200,'admin signs back in');
check(req('DELETE','/staff/products/training-tee')->getStatusCode()===409,'sold product cannot be deleted');
check(DB::table('catalog_products')->where('id','training-tee')->exists() && DB::table('variants')->where('sku','cust-sku')->exists(),'sold product and variants kept');
check(req('DELETE','/staff/products/'.$productId)->getStatusCode()===200,'unsold product can be deleted');
// ADM-04: server-side order filters work across all pages.
$filtered=req('GET','/staff/orders?status=cancelled');$cancelled=json_decode($filtered->getContent(),true);
check(count($cancelled)>=1 && count(array_filter($cancelled,fn($o)=>$o['status']!=='cancelled'))===0,'orders filtered by status');
check($filtered->headers->get('X-Total-Count')===(string)count($cancelled),'orders total count header');
$byId=json_decode(req('GET','/staff/orders?q='.substr($ownOrderId,0,8))->getContent(),true);
check(count($byId)===1 && $byId[0]['id']===$ownOrderId,'orders searched by id prefix');
// ADM-06: staff can edit label (badge), fit and collection membership from the product editor.
DB::table('collections')->insertOrIgnore([['slug'=>'summer','name'=>'مجموعة الصيف'],['slug'=>'winter','name'=>'مجموعة الشتاء']]);
$bundleCatalog=json_decode(req('GET','/staff/catalog')->getContent(),true);
check(isset($bundleCatalog['collections']) && count($bundleCatalog['collections'])>=2,'staff catalog lists collections');
$editColor=(string)Illuminate\Support\Str::uuid();
$editable=['id'=>null,'name'=>'Badged product','description'=>'With badge and fit','categoryId'=>DB::table('categories')->whereNotNull('parent_slug')->value('slug'),'price'=>45000,'published'=>true,
 'label'=>'NEW DROP','fit'=>'Oversized','collections'=>['summer'],
 'colorOptions'=>[['id'=>$editColor,'name'=>'Navy','hex'=>'#101840','images'=>[]]],'sizeOptions'=>['M','L'],
 'variants'=>[['colorId'=>$editColor,'size'=>'M','stock'=>4],['colorId'=>$editColor,'size'=>'L','stock'=>6]],'originalVariants'=>[]];
$saved=req('POST','/staff/products',$editable);check($saved->getStatusCode()===200,'product saved with badge, fit and collection');
$badgedId=json_decode($saved->getContent(),true)['id'];
$details=json_decode(DB::table('catalog_products')->where('id',$badgedId)->value('details'),true);
check(($details['label']??'')==='NEW DROP' && ($details['fit']??'')==='Oversized','badge and fit persisted');
check(DB::table('collection_product')->where('product_id',$badgedId)->pluck('collection_slug')->all()===['summer'],'collection membership saved');
$fromCatalog=collect(json_decode(req('GET','/staff/catalog')->getContent(),true)['products'])->firstWhere('id',$badgedId);
check(($fromCatalog['label']??'')==='NEW DROP' && ($fromCatalog['collections']??[])===['summer'],'staff catalog returns badge and collections');
$editable['id']=$badgedId;$editable['collections']=['winter'];$editable['label']='';
$editable['originalVariants']=DB::table('variants')->where('product_id',$badgedId)->orderBy('sku')->get()->map(fn($v)=>['sku'=>$v->sku,'stock'=>(int)$v->stock])->all();
check(req('POST','/staff/products',$editable)->getStatusCode()===200,'product collections reassigned');
check(DB::table('collection_product')->where('product_id',$badgedId)->pluck('collection_slug')->all()===['winter'],'old collection membership removed');
$storefront=json_decode(req('GET','/api/v1/products')->getContent(),true);
$public=collect($storefront['products'])->firstWhere('id',$badgedId);
check(($public['collections']??[])===['winter'],'storefront sees the new collection');
// ADM-07: a colour/size that has sold cannot be silently dropped from the product.
DB::table('variants')->where('product_id',$badgedId)->where('size','M')->update(['sku'=>'badged-sold-sku']);
DB::table('inventory_movements')->insert(['sku'=>'badged-sold-sku','order_id'=>$ownOrderId,'quantity'=>-1,'reason'=>'sale','created_at'=>now()]);
$shrunk=$editable;$shrunk['sizeOptions']=['L'];
$shrunk['variants']=[['colorId'=>$editColor,'size'=>'L','stock'=>6]];
$shrunk['originalVariants']=DB::table('variants')->where('product_id',$badgedId)->orderBy('sku')->get()->map(fn($v)=>['sku'=>$v->sku,'stock'=>(int)$v->stock])->all();
check(req('POST','/staff/products',$shrunk)->getStatusCode()===409,'cannot remove a sold variant');
check(DB::table('variants')->where('sku','badged-sold-sku')->exists(),'sold variant kept after refused edit');
echo "Completed ".$checks." isolated checks.".PHP_EOL;
