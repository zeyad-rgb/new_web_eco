<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $products = json_decode(file_get_contents(base_path('../frontend/public/products.json')), true, flags: JSON_THROW_ON_ERROR);
        foreach ($products as $product) {
            foreach (['أسود', 'رمادي', 'أبيض'] as $colorIndex => $color) {
                foreach (['M', 'L', 'XL', '2XL', '3XL'] as $size) {
                    DB::table('variants')->insertOrIgnore([
                        'sku' => "{$product['id']}-{$colorIndex}-{$size}", 'product_id' => $product['id'],
                        'color' => $color, 'size' => $size,
                        'stock' => $product['id'] === 'training-shorts' && $size === '3XL' ? 0 : 5,
                    ]);
                }
            }
        }
    }
}

