import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
import { e2eEnv, php } from '../playwright.config'

// Rebuild the disposable E2E database from migrations + demo seed.
// Safety: refuses to touch any file other than backend/database/e2e.sqlite.
export default async function globalSetup() {
  const backendDir = path.resolve(here, '../../backend')
  const db = path.resolve(e2eEnv.DB_DATABASE)
  if (path.basename(db) !== 'e2e.sqlite') throw new Error(`Refusing to reset non-E2E database: ${db}`)
  for (const suffix of ['', '-wal', '-shm', '-journal']) fs.rmSync(db + suffix, { force: true })
  fs.writeFileSync(db, '')
  const env = { ...process.env, ...e2eEnv }
  execFileSync(php, ['artisan', 'migrate', '--seed', '--force', '--no-interaction'], { cwd: backendDir, env, stdio: 'inherit' })
  // Test staff accounts (E2E database only). Passwords are test values, not real credentials.
  execFileSync(php, ['-r', `
    require 'vendor/autoload.php';
    $app = require 'bootstrap/app.php';
    $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
    foreach ([['e2e-admin@example.test','admin'],['e2e-manager@example.test','catalog_manager']] as [$email,$role]) {
      Illuminate\\Support\\Facades\\DB::table('catalog_staff')->updateOrInsert(['email'=>$email],
        ['password_hash'=>Illuminate\\Support\\Facades\\Hash::make('E2e-test-password-123!'),'role'=>$role,'active'=>true,'mfa_required'=>false]);
    }
  `], { cwd: backendDir, env, stdio: 'inherit' })
}
