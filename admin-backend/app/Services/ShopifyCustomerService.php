<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ShopifyCustomerService
{
    public static function getCustomerData(string $auth0_email): ?array
    {
        $cacheKey = "shopify_customer_{$auth0_email}";
        $customerData = Cache::get($cacheKey);

        if (!$customerData) {
            Log::warning('No cached customer data found for email:', ['email' => $auth0_email]);
            return null;
        }

        return [
            'customer_id' => $customerData['customer_id'],
            'email' => $customerData['email'],
        ];
    }
}