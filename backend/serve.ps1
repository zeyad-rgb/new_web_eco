param([string]$PhpPath = '', [int]$Port = 8009)
$ErrorActionPreference = 'Stop'
if (!$PhpPath) {
  $phpCommand = Get-Command php -ErrorAction SilentlyContinue
  if ($phpCommand) { $PhpPath = $phpCommand.Source }
  elseif (Test-Path -LiteralPath 'F:\php84\php.exe') { $PhpPath = 'F:\php84\php.exe' }
  else { throw 'Pass -PhpPath pointing to your PHP 8.4 executable.' }
}
$publicPath = Join-Path $PSScriptRoot 'public'
$routerPath = Join-Path $PSScriptRoot 'vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php'
Push-Location -LiteralPath $publicPath
try {
  & $PhpPath -d upload_max_filesize=10M -d post_max_size=12M -d memory_limit=256M -d max_execution_time=60 -d max_input_time=120 -S "127.0.0.1:$Port" $routerPath
} finally { Pop-Location }
