<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Auth0\SDK\Configuration\SdkConfiguration;
use Auth0\SDK\Token;

class CheckAuth0Token
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Token not provided'], 401);
        }

        try {
            // Configure Auth0 SDK
            $configuration = new SdkConfiguration([
                'domain' => env('AUTH0_DOMAIN'),
                'clientId' => env('AUTH0_CLIENT_ID'),
                'clientSecret' => env('AUTH0_CLIENT_SECRET'),
                'audience' => [env('AUTH0_AUDIENCE')],
                'tokenAlgorithm' => 'RS256',
                'cookieSecret' => env('AUTH0_COOKIE_SECRET'),
            ]);
            // $configuration = new SdkConfiguration([
            //     'domain' => env('AUTH0_DOMAIN', 'account-dev.biogena.dev'),
            //     'clientId' => env('AUTH0_CLIENT_ID', 'QsObtBCAMmt32DYts4ZQuMooBtfjx9iY'),
            //     'clientSecret' => env('AUTH0_CLIENT_SECRET', 'AsHcU59p5ITntJjb1PzkaFxx5uL3_IQPcpdD8YHe07m2_gh2M0xahwrL8-pINOS'),
            //     'audience' => [env('AUTH0_AUDIENCE', 'https://api-dev.biogena.dev')],
            //     'tokenAlgorithm' => 'RS256',
            //     'cookieSecret' => env('AUTH0_COOKIE_SECRET', 'XUbwvYaM4V3B56ZOaBlBwl4shDZOf7gGIMYbDA93dwjfAaWNiL6TBJaC4GXRzYGt'),
            // ]);

            // Verify and decode token
            $verifier = new Token($configuration, $token, Token::TYPE_ACCESS_TOKEN);
            $decoded = $verifier->verify()->validate()->toArray();

            $auth0_email = $decoded['https://profile.biogena.com/email'] ?? null;
            if (!$auth0_email) {
                Log::error('No email found in Auth0 token');
                return response()->json(['error' => 'Email not found in Auth0 token'], 401);
            }

            Log::info('Auth0 Token Verified:', ['email' => $auth0_email]);

            // // Check cache for customer data
            // $cacheKey = "shopify_customer_{$auth0_email}";
            // $customerData = Cache::get($cacheKey);

            // if (!$customerData) {
            //     // Fetch customer data from Shopify Admin API
            //     $shopifyURL = 'https://biogena-shop.myshopify.com/admin/api/2025-07/graphql.json';
            //     $query = <<<'GRAPHQL'
            //     query GetCustomer($email: String!) {
            //         customers(first: 1, query: $email) {
            //             edges {
            //                 node {
            //                     id
            //                     email
            //                 }
            //             }
            //         }
            //     }
            //     GRAPHQL;

            //     $response = Http::withHeaders([
            //         'X-Shopify-Access-Token' => env('SHOPIFY_ADMIN_ACCESS_TOKEN', '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'),
            //         'Content-Type' => 'application/json',
            //     ])->post($shopifyURL, [
            //         'query' => $query,
            //         'variables' => [
            //             'email' => "email:$auth0_email",
            //         ],
            //     ]);

            //     $data = $response->json();

            //     Log::info('Shopify Customer Query Response:', [
            //         'status' => $response->status(),
            //         'body' => $data,
            //         'email' => $auth0_email,
            //     ]);

            //     if (isset($data['errors'])) {
            //         $errorMessages = array_map(fn($err) => $err['message'], $data['errors']);
            //         $errorCode = $data['errors'][0]['extensions']['code'] ?? 'Unknown';
            //         Log::error('Shopify GraphQL Error:', ['errors' => $errorMessages, 'code' => $errorCode]);
            //         return response()->json(['error' => 'GraphQL error: ' . implode(', ', $errorMessages)], 400);
            //     }

            //     $customer = $data['data']['customers']['edges'][0]['node'] ?? null;
            //     if (!$customer) {
            //         Log::warning('No customer found for email:', ['email' => $auth0_email]);
            //         return response()->json(['error' => 'No customer found for the provided email'], 404);
            //     }

            //     // Cache the customer data 
            //     $customerData = [
            //         'customer_id' => $customer['id'],
            //         'email' => $customer['email'],
            //     ];
            //     Cache::put($cacheKey, $customerData, now()->addHours(24));

            //     Log::info('Cached Shopify Customer Data:', ['customerData' => $customerData]);
            // }

            // // Add customer data to request
            // $request->attributes->add([
            //     'auth0_email' => $auth0_email,
            //     'shopify_customer_id' => $customerData['customer_id'],
            //     'shopify_email' => $customerData['email'],
            // ]);

            return $next($request);
        } catch (\Exception $e) {
            Log::error('Token verification:', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid token: ' . $e->getMessage()], 401);
        }
    }
}