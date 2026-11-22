require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$users = Illuminate\Support\Facades\DB::table('catalog_staff')->get(['email', 'role', 'active']);
echo json_encode($users, JSON_PRETTY_PRINT);
