<?php

use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/products', [ShopController::class, 'catalog'])->middleware('throttle:catalog');
    Route::post('/orders', [ShopController::class, 'order'])->middleware(['web', 'throttle:orders']);
    Route::post('/orders/track', [ShopController::class, 'trackOrder'])->middleware('throttle:orders');
});
