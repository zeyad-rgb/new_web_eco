<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

final class CustomerDirectory
{
    /**
     * Build customer directory from registered customers and decrypted order records.
     *
     * @return array{data: array<int, array<string, mixed>>, total: int}
     */
    public static function paginate(int $page = 1, int $perPage = 50): array
    {
        $orders = DB::table('orders')->orderByDesc('created_at')->get(['id', 'customer_id', 'customer', 'total', 'created_at']);
        $registered = DB::table('customers')->get()->keyBy('id');

        $directory = [];

        foreach ($orders as $order) {
            $cust = [];
            try {
                $cust = json_decode(Crypt::decryptString($order->customer), true, flags: JSON_THROW_ON_ERROR);
            } catch (\Throwable) {
                // Ignore decryption failure
            }

            $phone = trim($cust['phone'] ?? '');
            if (!$phone && $order->customer_id && isset($registered[$order->customer_id])) {
                $phone = $registered[$order->customer_id]->phone ?? '';
            }

            // Fallback key if phone is missing
            $key = $phone ?: ('order_' . $order->id);

            $address = trim($cust['address'] ?? '');
            $gov = '';
            if ($address) {
                $parts = explode(' - ', $address);
                $gov = trim($parts[0] ?? '');
            }

            if (!isset($directory[$key])) {
                $name = trim($cust['name'] ?? '');
                if (!$name && $order->customer_id && isset($registered[$order->customer_id])) {
                    $name = $registered[$order->customer_id]->name ?? '';
                }

                $directory[$key] = [
                    'id' => $order->customer_id ?? $key,
                    'name' => $name ?: 'عميل',
                    'phone' => $phone,
                    'governorate' => $gov ?: 'القاهرة',
                    'address' => $address,
                    'orders_count' => 0,
                    'total_spent' => 0,
                    'first_order_date' => $order->created_at,
                    'last_order_date' => $order->created_at,
                ];
            }

            $directory[$key]['orders_count']++;
            $directory[$key]['total_spent'] += (int) $order->total;
            if ($order->created_at > $directory[$key]['last_order_date']) {
                $directory[$key]['last_order_date'] = $order->created_at;
                if ($address) {
                    $directory[$key]['address'] = $address;
                    if ($gov) $directory[$key]['governorate'] = $gov;
                }
            }
            if ($order->created_at < $directory[$key]['first_order_date']) {
                $directory[$key]['first_order_date'] = $order->created_at;
            }
        }

        // Add registered customers who haven't placed an order yet
        foreach ($registered as $reg) {
            $phone = trim($reg->phone ?? '');
            $key = $phone ?: ('cust_' . $reg->id);
            if (!isset($directory[$key])) {
                $directory[$key] = [
                    'id' => $reg->id,
                    'name' => $reg->name ?? 'عميل مسجل',
                    'phone' => $phone,
                    'governorate' => 'القاهرة',
                    'address' => '',
                    'orders_count' => 0,
                    'total_spent' => 0,
                    'first_order_date' => $reg->created_at ?? now()->toDateTimeString(),
                    'last_order_date' => $reg->created_at ?? now()->toDateTimeString(),
                ];
            }
        }

        // Sort by last order date desc
        $list = array_values($directory);
        usort($list, static fn ($a, $b) => strcmp($b['last_order_date'], $a['last_order_date']));

        $total = count($list);
        $offset = max(0, ($page - 1) * $perPage);
        $sliced = array_slice($list, $offset, $perPage);

        return [
            'data' => $sliced,
            'total' => $total,
        ];
    }
}
