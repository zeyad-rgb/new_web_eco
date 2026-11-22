<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $rows = DB::table('store_settings')->get();

        foreach ($rows as $row) {
            try {
                Crypt::decryptString($row->value);
            } catch (Throwable) {
                DB::table('store_settings')->where('key', $row->key)->update([
                    'value' => Crypt::encryptString($row->value),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Encryption is retained intentionally; plain-text settings are not restored.
    }
};
