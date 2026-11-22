<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class ProductEditorController
{
    private const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

    public function limits() {
        $bytes = static function (string $value): int {
            $number = (int)$value;
            return $number * match (strtolower(substr(trim($value),-1))) { 'g'=>1073741824, 'm'=>1048576, 'k'=>1024, default=>1 };
        };
        $fileLimit = $bytes((string)ini_get('upload_max_filesize'));
        $postLimit = $bytes((string)ini_get('post_max_size'));
        $limits = [self::MAX_UPLOAD_BYTES];
        if ($fileLimit > 0) $limits[] = $fileLimit;
        if ($postLimit > 0) $limits[] = max(1,$postLimit - 65536);
        return response()->json(['maxBytes'=>min($limits),'applicationMaxBytes'=>self::MAX_UPLOAD_BYTES,'formats'=>['image/jpeg','image/png','image/webp'],'imageProcessingAvailable'=>function_exists('imagewebp')])->header('Cache-Control','no-store');
    }

    public function upload(Request $request)
    {
        $request->validate(['image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:10240', 'dimensions:max_width=12000,max_height=12000']]);
        abort_unless(function_exists('imagewebp'),503,'Image processing is unavailable: enable PHP GD with WebP support.');
        $file = $request->file('image');
        $extension = match ($file->getMimeType()) {
            'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
            default => abort(422, 'صيغة الصورة غير مدعومة.'),
        };
        $dimensions = getimagesize($file->getPathname());
        abort_unless($dimensions && $dimensions[0] * $dimensions[1] <= 24000000,422,'Image exceeds the pixel limit.');
        $id = (string) Str::uuid();
        $directory = storage_path('app/product-media');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        $extension = 'webp';
        $path = $directory.'/'.$id.'.'.$extension;
        $source = imagecreatefromstring(file_get_contents($file->getPathname()));
        abort_unless($source,422,'Invalid image.');
        $ratio = min(1,1600/max($dimensions[0],$dimensions[1]));
        $image = imagescale($source,max(1,(int)round($dimensions[0]*$ratio)),max(1,(int)round($dimensions[1]*$ratio)));
        abort_unless($image && imagewebp($image,$path,85),500,'Unable to store image.');
        imagedestroy($source); imagedestroy($image);
        try {
            DB::table('product_media')->insert([
                'id' => $id, 'extension' => $extension, 'product_id' => null,
                'owner' => $request->session()->get('catalog_staff')['email'], 'created_at' => now(),
            ]);
        } catch (\Throwable $error) {
            @unlink($path);
            throw $error;
        }
        return response()->json(['url' => '/media/'.$id], 201);
    }

    public function save(Request $request)
    {
        $data = $request->validate([
            'id' => ['nullable', 'string', Rule::exists('catalog_products', 'id')],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1500'],
            'categoryId' => ['required', Rule::exists('categories', 'slug')],
            'price' => ['required', 'integer', 'between:1,100000000'],
            'published' => ['required', 'boolean'],
            'colorOptions' => ['required', 'array', 'list', 'min:1', 'max:100'],
            'colorOptions.*' => ['required', 'array:id,name,hex,images'],
            'colorOptions.*.id' => ['required', 'uuid', 'distinct'],
            'colorOptions.*.name' => ['required', 'string', 'max:60', 'distinct:ignore_case'],
            'colorOptions.*.hex' => ['required', 'regex:/\A#[a-fA-F0-9]{6}\z/'],
            'colorOptions.*.images' => ['present', 'array', 'list', 'max:250'],
            'colorOptions.*.images.*' => ['required', 'string', 'regex:~\A/media/[a-f0-9-]{36}\z~'],
            'sizeOptions' => ['required', 'array', 'list', 'min:1', 'max:100'],
            'sizeOptions.*' => ['required', 'string', 'max:40', 'distinct:ignore_case'],
            'variants' => ['required', 'array', 'list', 'min:1', 'max:500'],
            'variants.*.colorId' => ['required', 'uuid'],
            'variants.*.size' => ['required', 'string', 'max:40'],
            'variants.*.stock' => ['required', 'integer', 'between:0,1000000'],
            'originalVariants' => ['present', 'array', 'list', 'max:500'],
            'originalVariants.*.sku' => ['required', 'string', 'max:100'],
            'originalVariants.*.stock' => ['required', 'integer', 'min:0'],
        ]);
        $id = $data['id'] ?? (string) Str::uuid();
        $colors = collect($data['colorOptions'])->keyBy('id');
        $mediaUrls = $colors->flatMap(fn ($color) => $color['images'])->values();
        abort_if($mediaUrls->count() > 250, 422, 'أقصى عدد صور 250 صورة.');
        $mediaIds = $mediaUrls->map(fn ($url) => substr($url, 7))->unique()->values();
        $combinations = [];
        foreach ($data['variants'] as $variant) {
            abort_unless($colors->has($variant['colorId']) && in_array($variant['size'], $data['sizeOptions'], true), 422, 'خيارات المنتج غير متطابقة.');
            $key = $variant['colorId'].':'.$variant['size'];
            abort_if(isset($combinations[$key]), 422, 'المتغير مكرر.');
            $combinations[$key] = true;
        }
        abort_unless(count($combinations) === $colors->count() * count($data['sizeOptions']), 422, 'كمّل تركيبات اللون والمقاس.');

        DB::transaction(function () use ($data, $id, $colors, $mediaIds, $request): void {
            $existing = DB::table('catalog_products')->where('id', $id)->lockForUpdate()->first();
            $old = DB::table('variants')->where('product_id', $id)->orderBy('sku')->lockForUpdate()->get();
            $expected = collect($data['originalVariants'])->mapWithKeys(fn ($item) => [$item['sku'] => (int) $item['stock']])->sortKeys()->all();
            $current = $old->mapWithKeys(fn ($item) => [$item->sku => (int) $item->stock])->sortKeys()->all();
            abort_unless($current === $expected, 409, 'المخزون اتغيّر. افتح المنتج من القائمة تاني قبل الحفظ.');

            $media = DB::table('product_media')->whereIn('id', $mediaIds)->lockForUpdate()->get();
            abort_unless($media->count() === $mediaIds->count(), 422, 'إحدى الصور غير متاحة.');
            $email = $request->session()->get('catalog_staff')['email'];
            foreach ($media as $file) {
                abort_unless($file->product_id === $id || ($file->product_id === null && $file->owner === $email), 403);
            }
            $details = $existing ? json_decode($existing->details, true, flags: JSON_THROW_ON_ERROR) : [];
            DB::table('catalog_products')->updateOrInsert(['id' => $id], [
                'category_slug' => $data['categoryId'], 'published' => $data['published'],
                'details' => json_encode([
                    ...$details, 'id' => $id, 'name' => $data['name'], 'description' => $data['description'] ?? '',
                    'price' => $data['price'], 'colorOptions' => $colors->values()->all(), 'sizeOptions' => $data['sizeOptions'],
                    'images' => $colors->flatMap(fn ($color) => $color['images'])->values()->all(),
                    'label' => $details['label'] ?? '', 'image' => $details['image'] ?? '', 'fit' => $details['fit'] ?? '',
                ], JSON_THROW_ON_ERROR),
            ]);
            $kept = [];
            foreach ($data['variants'] as $variant) {
                $color = $colors->get($variant['colorId']);
                $prior = $old->first(fn ($row) =>
                    $row->size === $variant['size'] && ($row->color_key === $color['id'] || ($row->color_key === null && $row->color === $color['name'])));
                $sku = $prior?->sku ?? (string) Str::uuid();
                $kept[] = $sku;
                DB::table('variants')->updateOrInsert(['sku' => $sku], [
                    'product_id' => $id, 'color' => $color['name'], 'color_key' => $color['id'],
                    'size' => $variant['size'], 'stock' => $variant['stock'],
                ]);
            }
            DB::table('variants')->where('product_id', $id)->whereNotIn('sku', $kept)->delete();
            DB::table('product_media')->where('product_id', $id)->whereNotIn('id', $mediaIds)->update(['product_id' => null, 'owner' => $email]);
            DB::table('product_media')->whereIn('id', $mediaIds)->update(['product_id' => $id]);
        }, 3);
        ShopController::bustCatalogCache();
        return response()->json(['id' => $id]);
    }
}
