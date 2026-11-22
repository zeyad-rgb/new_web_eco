<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_types', function (Blueprint $table): void {
            $table->string('slug', 80)->primary();
            $table->string('name', 120);
        });

        Schema::table('categories', function (Blueprint $table): void {
            $table->string('parent_slug', 80)->nullable()->index();
            $table->string('type_slug', 80)->nullable()->index();
            $table->foreign('parent_slug')->references('slug')->on('categories')->restrictOnDelete();
            $table->foreign('type_slug')->references('slug')->on('product_types')->restrictOnDelete();
        });

        $seed = json_decode(file_get_contents(base_path('../frontend/src/taxonomy-seed.json')), true, flags: JSON_THROW_ON_ERROR);
        DB::table('product_types')->insert($seed['types']);

        foreach ($seed['categories'] as $category) {
            DB::table('categories')->insertOrIgnore($category);
            if (in_array($category['slug'], ['tees', 'shorts', 'bottoms'], true)) {
                DB::table('categories')->where('slug', $category['slug'])->update([
                    'parent_slug' => $category['parent_slug'],
                    'type_slug' => $category['type_slug'],
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            $table->dropForeign(['parent_slug']);
            $table->dropForeign(['type_slug']);
            $table->dropIndex(['parent_slug']);
            $table->dropIndex(['type_slug']);
            $table->dropColumn(['parent_slug', 'type_slug']);
        });
        Schema::dropIfExists('product_types');
    }
};
