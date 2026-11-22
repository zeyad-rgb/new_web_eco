<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Format Egyptian phone number to international format for WhatsApp.
     * '01012345678' → '201012345678'
     */
    public static function formatPhoneNumber(string $phone): string
    {
        $clean = preg_replace('/\D/', '', $phone);

        if (str_starts_with($clean, '01') && strlen($clean) === 11) {
            return '2' . $clean;
        }
        if (str_starts_with($clean, '201') && strlen($clean) === 12) {
            return $clean;
        }
        if (str_starts_with($clean, '0020')) {
            return substr($clean, 2);
        }

        return $clean;
    }

    /**
     * Build the branded order-confirmation message that the STORE sends TO the customer.
     */
    public static function buildConfirmationMessage(
        string $orderId,
        string $customerName,
        string $address,
        int    $totalPiastres,
        array  $lines = []
    ): string {
        $shortId        = strtoupper(substr($orderId, 0, 8));
        $formattedTotal = number_format($totalPiastres / 100, 0);

        $msg  = "⚡ *STUDIO ACTIVE · تأكيد الطلب* ⚡\n\n";
        $msg .= "أهلاً *{$customerName}*! 👋\n";
        $msg .= "تم استلام طلبك بنجاح وجاري تجهيزه ✅\n\n";
        $msg .= "📋 *تفاصيل الطلب:*\n";
        $msg .= "▸ رقم الطلب: *#{$shortId}*\n";
        $msg .= "▸ الإجمالي: *{$formattedTotal} ج.م* (الدفع عند الاستلام 💵)\n";
        $msg .= "▸ التوصيل إلى: {$address}\n";

        if (!empty($lines)) {
            $msg .= "\n🛍 *المنتجات:*\n";
            foreach ($lines as $line) {
                $sku = $line['sku'] ?? 'منتج';
                $qty = $line['quantity'] ?? 1;
                $msg .= "  • {$sku} × {$qty}\n";
            }
        }

        $msg .= "\n🚚 التوصيل خلال 24-48 ساعة عمل.\n";
        $msg .= "هنبعتلك رسالة تانية لما الشحنة تخرج مع المندوب.\n\n";
        $msg .= "لو عندك أي استفسار رد على الرسالة دي مباشرة 💬\n";
        $msg .= "شكراً لاختيارك *Studio Active*! ✨";

        return $msg;
    }

    /**
     * Build a status-update message (shipped / delivered / cancelled).
     */
    public static function buildStatusMessage(
        string $orderId,
        string $customerName,
        string $newStatus
    ): string {
        $shortId = strtoupper(substr($orderId, 0, 8));

        $statusMessages = [
            'shipped'   => "🚚 *STUDIO ACTIVE · تحديث الشحن*\n\nأهلاً *{$customerName}*!\nطلبك *#{$shortId}* خرج دلوقتي مع مندوب التوصيل وفي الطريق إليك.\nلو محتاج أي حاجة تواصل معانا على الرقم ده 💬",
            'delivered' => "✅ *STUDIO ACTIVE · تم التوصيل*\n\nأهلاً *{$customerName}*!\nطلبك *#{$shortId}* اتسلّم بنجاح.\nنتمنالك تجربة رياضية رائعة! ⭐\nلو عجبك المنتج شاركنا رأيك 💪",
            'cancelled' => "❌ *STUDIO ACTIVE · إلغاء الطلب*\n\nأهلاً *{$customerName}*,\nتم إلغاء طلبك *#{$shortId}* بناءً على طلبك.\nلو تغيّرت رأيك يسعدنا نخدمك مرة تانية! 🤝",
        ];

        return $statusMessages[$newStatus] ?? "📦 *STUDIO ACTIVE*\nتحديث على طلبك *#{$shortId}*: الحالة الجديدة: {$newStatus}";
    }

    /**
     * Generate a wa.me link that opens WhatsApp with a pre-filled message.
     * This is used by the ADMIN to send from their phone/WhatsApp Business app.
     */
    public static function getAdminSendLink(string $customerPhone, string $message): string
    {
        $formattedPhone = self::formatPhoneNumber($customerPhone);
        return 'https://wa.me/' . $formattedPhone . '?text=' . rawurlencode($message);
    }

    /**
     * Main dispatcher: When an order is placed, generate the WhatsApp send link
     * for the admin and optionally auto-send via a configured API gateway.
     *
     * Flow:
     *  1. Order placed by customer → backend calls this method
     *  2. Builds confirmation message
     *  3. If a gateway (UltraMsg / webhook) is configured → sends automatically
     *  4. Always returns the wa.me admin link so the admin can send manually too
     *  5. Logs everything in audit_events for the admin dashboard
     */
    public static function dispatchOrderConfirmation(
        string $orderId,
        string $phone,
        string $customerName,
        string $address,
        int    $totalPiastres,
        array  $lines = []
    ): array {
        $message        = self::buildConfirmationMessage($orderId, $customerName, $address, $totalPiastres, $lines);
        $formattedPhone = self::formatPhoneNumber($phone);
        $adminSendLink  = self::getAdminSendLink($phone, $message);

        // Load WhatsApp settings from DB, supporting encrypted and legacy plain JSON values.
        $settingRow = DB::table('store_settings')->where('key', 'whatsapp')->first();
        $settings = [];
        if ($settingRow) {
            try { $settings = json_decode(Crypt::decryptString($settingRow->value), true) ?: []; }
            catch (\Throwable) { $settings = json_decode($settingRow->value, true) ?: []; }
        }

        $enabled    = $settings['enabled'] ?? true;
        $provider   = $settings['provider'] ?? 'manual';
        $webhookUrl = $settings['webhook_url'] ?? '';
        $apiToken   = $settings['api_token'] ?? '';
        $instanceId = $settings['instance_id'] ?? '';

        $autoSent = false;
        $error    = null;

        // ── Auto-send via gateway if configured ──────────────────────────
        if ($enabled && !empty($webhookUrl) && $provider !== 'manual') {
            try {
                if ($provider === 'ultramsg') {
                    // UltraMsg API
                    $response = Http::timeout(8)->post($webhookUrl, [
                        'token'   => $apiToken,
                        'to'      => $formattedPhone,
                        'body'    => $message,
                    ]);
                    $autoSent = $response->successful();
                } elseif ($provider === 'callmebot') {
                    // CallMeBot (free) — format: https://api.callmebot.com/whatsapp.php?phone=PHONE&text=TEXT&apikey=KEY
                    $url = 'https://api.callmebot.com/whatsapp.php?' . http_build_query([
                        'phone'  => $formattedPhone,
                        'text'   => $message,
                        'apikey' => $apiToken,
                    ]);
                    $response = Http::timeout(10)->get($url);
                    $autoSent = $response->successful();
                } else {
                    // Generic webhook (Zapier / Make / n8n / custom)
                    $response = Http::timeout(8)->post($webhookUrl, [
                        'to'       => $formattedPhone,
                        'phone'    => $formattedPhone,
                        'body'     => $message,
                        'message'  => $message,
                        'order_id' => $orderId,
                        'customer' => $customerName,
                        'total'    => $totalPiastres,
                        'token'    => $apiToken,
                        'instance' => $instanceId,
                    ]);
                    $autoSent = $response->successful();
                }
            } catch (\Throwable $e) {
                Log::warning('WhatsApp auto-send failed', [
                    'provider' => $provider,
                    'error'    => 'Provider request failed',
                    'order_id' => $orderId,
                ]);
                $error = 'Provider request failed';
            }
        }

        // ── Record in audit log ──────────────────────────────────────────
        try {
            DB::table('audit_events')->insert([
                'actor_email'  => 'system@studioactive.internal',
                'event'        => $autoSent ? 'whatsapp.auto_sent' : 'whatsapp.pending_manual_send',
                'subject_type' => 'order',
                'subject_id'   => $orderId,
                'metadata'     => json_encode([
                    'customer_phone'  => $formattedPhone,
                    'customer_name'   => $customerName,
                    'auto_sent'       => $autoSent,
                    'provider'        => $provider,
                    'error'           => $error,
                    'admin_send_link' => $adminSendLink,
                ], JSON_THROW_ON_ERROR),
                'ip_address'  => request()->ip() ?? '127.0.0.1',
                'created_at'  => now(),
            ]);
        } catch (\Throwable) {
            // Don't block order creation if audit fails
        }

        // ── Record pending notification for admin dashboard ──────────────
        try {
            DB::table('whatsapp_queue')->insert([
                'order_id'       => $orderId,
                'customer_phone' => $formattedPhone,
                'customer_name'  => $customerName,
                'message'        => $message,
                'admin_send_url' => $adminSendLink,
                'auto_sent'      => $autoSent,
                'manually_sent'  => false,
                'created_at'     => now(),
            ]);
        } catch (\Throwable) {
            // Table might not exist yet, fail silently
        }

        return [
            'auto_sent'      => $autoSent,
            'phone'          => $formattedPhone,
            'admin_send_url' => $adminSendLink,
            'provider'       => $provider,
        ];
    }
}
