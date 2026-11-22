<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Jobs\SendOrderConfirmation;

$passed = 0;
$failed = 0;

function assertTest(bool $condition, string $title): void {
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "[PASS] " . $title . PHP_EOL;
    } else {
        $failed++;
        echo "[FAIL] " . $title . PHP_EOL;
    }
}

echo "=== QUEUE & CRON RELIABILITY VERIFICATION SUITE ===" . PHP_EOL;

// Ensure database queue tables exist
$hasJobsTable = DB::getSchemaBuilder()->hasTable('jobs');
assertTest($hasJobsTable, "Database queue 'jobs' table exists");

$hasFailedJobsTable = DB::getSchemaBuilder()->hasTable('failed_jobs');
assertTest($hasFailedJobsTable, "Database queue 'failed_jobs' table exists");

// 1. Dispatching Job to Queue
$initialPending = DB::table('jobs')->count();
SendOrderConfirmation::dispatch('test-nonexistent-order-id');
$afterDispatch = DB::table('jobs')->count();

assertTest($afterDispatch === $initialPending + 1, "Job successfully pushed to 'jobs' table (count incremented)");

// Ensure available_at timestamp is reached
sleep(1);

// 2. Queue Work Execution (--stop-when-empty)
$exitCode = Artisan::call('queue:work', [
    '--stop-when-empty' => true,
    '--tries' => 3,
    '--max-time' => 50,
]);

assertTest($exitCode === 0, "queue:work --stop-when-empty terminates cleanly with exit code 0");
$afterWork = DB::table('jobs')->count();
assertTest($afterWork === $initialPending, "Processed job cleanly dequeued from 'jobs' table");

// 3. Backlog Recovery Test: Batch of 5 jobs
for ($i = 1; $i <= 5; $i++) {
    SendOrderConfirmation::dispatch("batch-order-{$i}");
}
$backlogCount = DB::table('jobs')->count();
assertTest($backlogCount >= 5, "Backlog of 5 jobs queued successfully");

$batchExit = Artisan::call('queue:work', [
    '--stop-when-empty' => true,
    '--tries' => 3,
    '--max-time' => 50,
]);
assertTest($batchExit === 0, "Backlog of jobs processed completely without timeout");
assertTest(DB::table('jobs')->count() === 0, "All backlog jobs drained cleanly");

// 4. Verify Scheduler Command Definition in console.php
$scheduleOutput = '';
Artisan::call('schedule:list');
$scheduleList = Artisan::output();
assertTest(str_contains($scheduleList, 'queue:work'), "Scheduler explicitly defines queue:work task in schedule:list");

echo sprintf("QUEUE SUITE: %d PASSED, %d FAILED" . PHP_EOL, $passed, $failed);
exit($failed > 0 ? 1 : 0);
