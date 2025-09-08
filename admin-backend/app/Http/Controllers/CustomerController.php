<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    protected function sealRequest(string $method, string $endpoint, array $data = [], array $query = [], int $retries = 2)
    {
        $sealApiUrl = config('services.seal.api_base_url') . $endpoint;
        $sealApiToken = config('services.seal.api_token');

        $fullUrl = $sealApiUrl;
        if (!empty($query)) {
            $fullUrl .= (strpos($sealApiUrl, '?') === false ? '?' : '&') . http_build_query($query);
        }

        for ($attempt = 1; $attempt <= $retries; $attempt++) {
            Log::info('Seal API Request:', [
                'attempt' => $attempt,
                'method' => $method,
                'url' => $fullUrl,
                'data' => $data,
                'headers' => ['X-Seal-Token' => substr($sealApiToken, 0, 10) . '...'],
            ]);

            $response = Http::withHeaders([
                'X-Seal-Token' => $sealApiToken,
                'Content-Type' => 'application/json',
            ])->$method($sealApiUrl, empty($query) ? $data : array_merge($data, $query));

            $responseData = $response->json();

            // Log::info('Seal API Response:', [
            //     'attempt' => $attempt,
            //     'status' => $response->status(),
            //     'body' => $responseData,
            // ]);

            if ($response->successful()) {
                return $responseData ?: [];
            }

            Log::error('Seal API Error:', [
                'attempt' => $attempt,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($attempt < $retries && in_array($response->status(), [429, 500, 503])) {
                sleep(1);
                continue;
            }

            $errorMessage = $responseData['error'] ?? 'Failed to process request';
            if ($response->status() === 403 && strpos($errorMessage, 'provide subscription ID') !== false) {
                $errorMessage = 'Invalid or missing subscription ID';
            }

            return ['error' => $errorMessage, 'status' => $response->status()];
        }

        return ['error' => 'Request failed after retries', 'status' => 500];
    }

    public function getAllCustomers(Request $request): JsonResponse
    {
        try {
            $shopifyUrl = config('services.shopify.domain') . 'admin/api/' . config('services.shopify.api_version') . '/graphql.json';
            $accessToken = config('services.shopify.admin_access_token');

            // Get page number from query parameter (default to 1)
            $page = max(1, (int) $request->query('page', 1));
            $limit = 50; // Customers per page
            $cursor = null;

            // Log the start of the request
            Log::info('Fetching customers from Shopify GraphQL API', [
                'url' => $shopifyUrl,
                'api_version' => config('services.shopify.api_version'),
                'access_token' => $accessToken ? 'set' : 'not set',
                'page' => $page,
            ]);

            // GraphQL query with pagination
            $query = <<<'GRAPHQL'
            query CustomerList($first: Int!, $after: String) {
                customers(first: $first, after: $after) {
                    nodes {
                        id
                        firstName
                        lastName
                        defaultEmailAddress {
                            emailAddress
                            marketingState
                        }
                        defaultPhoneNumber {
                            phoneNumber
                            marketingState
                            marketingCollectedFrom
                        }
                        createdAt
                        updatedAt
                        numberOfOrders
                        state
                        amountSpent {
                            amount
                            currencyCode
                        }
                        verifiedEmail
                        taxExempt
                        tags
                        addresses {
                            id
                            firstName
                            lastName
                            address1
                            city
                            province
                            country
                            zip
                            phone
                            name
                            provinceCode
                            countryCodeV2
                        }
                        defaultAddress {
                            id
                            address1
                            city
                            province
                            country
                            zip
                            phone
                            provinceCode
                            countryCodeV2
                        }
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
            GRAPHQL;

            // Skip to the desired page
            if ($page > 1) {
                $skip = ($page - 1) * $limit; // Number of customers to skip
                $currentSkip = 0;

                while ($currentSkip < $skip) {
                    $response = Http::withHeaders([
                        'X-Shopify-Access-Token' => $accessToken,
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(30)
                    ->post($shopifyUrl, [
                        'query' => $query,
                        'variables' => [
                            'first' => $limit,
                            'after' => $cursor,
                        ],
                    ]);

                    if ($response->failed()) {
                        Log::error('Failed to fetch customers during pagination', [
                            'status' => $response->status(),
                            'body' => $response->body(),
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => 'Failed to fetch customers during pagination',
                            'error' => $response->json()['errors'] ?? 'Unknown error',
                        ], 500);
                    }

                    $data = $response->json()['data']['customers'] ?? [];
                    $currentSkip += count($data['nodes'] ?? []);
                    $cursor = $data['pageInfo']['endCursor'] ?? null;

                    if (!$cursor || !$data['pageInfo']['hasNextPage']) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Requested page exceeds available customers',
                            'error' => 'No more customers to fetch',
                        ], 404);
                    }

                    // Log query cost
                    $cost = $response->json()['extensions']['cost'] ?? [];
                    Log::info('GraphQL query cost', [
                        'actualQueryCost' => $cost['actualQueryCost'] ?? 'unknown',
                        'throttleStatus' => $cost['throttleStatus'] ?? 'unknown',
                    ]);

                    usleep(500000); // 0.5-second delay to respect rate limits
                }
            }

            // Fetch the desired page
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->post($shopifyUrl, [
                'query' => $query,
                'variables' => [
                    'first' => $limit,
                    'after' => $cursor,
                ],
            ]);

            // Check for failed request
            if ($response->failed()) {
                Log::error('Failed to fetch customers from Shopify GraphQL', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch customers',
                    'error' => $response->json()['errors'] ?? 'Unknown error',
                ], 500);
            }

            // Extract customers
            $data = $response->json()['data']['customers'] ?? [];
            $customers = $data['nodes'] ?? [];
            $hasNextPage = $data['pageInfo']['hasNextPage'] ?? false;

            // Log query cost
            $cost = $response->json()['extensions']['cost'] ?? [];
            Log::info('GraphQL query cost', [
                'actualQueryCost' => $cost['actualQueryCost'] ?? 'unknown',
                'throttleStatus' => $cost['throttleStatus'] ?? 'unknown',
            ]);

            Log::info('Successfully fetched customers', [
                'page' => $page,
                'total' => count($customers),
            ]);

            return response()->json([
                'success' => true,
                'customers' => $customers,
                'total' => count($customers),
                'page' => $page,
                'has_next_page' => $hasNextPage,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching Shopify customers (GraphQL)', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error while fetching customers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getACustomer(Request $request, $email)
    {
        try {
            $shopifyUrl = config('services.shopify.domain') . 'admin/api/' . config('services.shopify.api_version') . '/graphql.json';
            $accessToken = config('services.shopify.admin_access_token');

            if (!$accessToken || !$shopifyUrl) {
                throw new \Exception('Shopify configuration is missing');
            }

            $query = <<<'GRAPHQL'
            query GetCustomer($email: String!) {
                customers(first: 1, query: $email) {
                    edges {
                        node {
                            id
                            firstName
                            lastName
                            email
                            phone
                            createdAt
                            updatedAt
                            numberOfOrders
                            orders(first: 10) {
                                edges {
                                    node {
                                        id
                                        name
                                        processedAt
                                        totalPriceSet {
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }
                                        }
                                    }
                                }
                            }
                            image {
                                id
                                url 
                                width
                                height
                            }
                            state
                            amountSpent {
                                amount
                                currencyCode
                            }
                            verifiedEmail
                            taxExempt
                            tags
                            addresses {
                                id
                                firstName
                                lastName
                                address1
                                city
                                province
                                country
                                zip
                                phone
                                name
                                provinceCode
                                countryCodeV2
                            }
                            defaultAddress {
                                id
                                address1
                                city
                                province
                                country
                                zip
                                phone
                                provinceCode
                                countryCodeV2
                            }
                        }
                    }
                }
            }
            GRAPHQL;

            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken,
                'Content-Type' => 'application/json',
            ])->post($shopifyUrl, [
                'query' => $query,
                'variables' => [
                    'email' => "email:$email",
                ],
            ]);

            $data = $response->json();

            // Log a simplified version of the response to avoid normalization issues
            Log::info('Shopify Customer Query Response:', [
                'status' => $response->status(),
                'email' => $email,
                'customer_id' => $data['data']['customers']['edges'][0]['node']['id'] ?? null,
                'has_errors' => isset($data['errors']),
                'cost' => $data['extensions']['cost'] ?? null,
            ]);

            if ($response->failed()) {
                throw new \Exception('Shopify API request failed with status ' . $response->status());
            }

            if (isset($data['errors'])) {
                $errorMessages = array_map(fn($err) => $err['message'], $data['errors']);
                $errorCode = $data['errors'][0]['extensions']['code'] ?? 'Unknown';

                Log::error('Shopify GraphQL Error:', [
                    'email' => $email,
                    'errors' => $errorMessages,
                    'code' => $errorCode,
                ]);

                return response()->json([
                    'success' => false,
                    'error' => implode(', ', $errorMessages),
                ], $this->mapGraphQLErrorCodeToStatus($errorCode));
            }

            $customer = $data['data']['customers']['edges'][0]['node'] ?? null;

            if (!$customer) {
                Log::warning('No customer found for email:', ['email' => $email]);
                return response()->json([
                    'success' => false,
                    'error' => 'Customer not found',
                ], 404);
            }

            Log::info('Successfully fetched customer', [
                'email' => $email,
                'customer_id' => $customer['id'],
                'number_of_orders' => $customer['numberOfOrders'],
            ]);

            // Fetch all subscriptions for the customer
            $seal_query = ['query' => $email];
            $subData = $this->sealRequest('get', 'subscriptions', [], $seal_query);

            if (isset($subData['error'])) {
                Log::error('Seal API error in getSubscriptions:', [
                    'error' => $subData['error'],
                    'status' => $subData['status'],
                ]);
                return response()->json(['success' => false, 'error' => $subData['error']], $subData['status']);
            }

            $subscriptions = $subData['payload']['subscriptions'] ?? [];

            $filteredSubscriptions = array_filter($subscriptions, function ($sub) use ($email) {
                return strtolower($sub['email']) === strtolower($email);
            });

            Log::info('Filtered subscriptions:', [
                'email' => $email,
                'count' => count($filteredSubscriptions),
                'subscriptions' => array_map(function ($sub) {
                    return ['id' => $sub['id'], 'email' => $sub['email'], 'status' => $sub['status']];
                }, $filteredSubscriptions),
            ]);

            // Transform the response to match Next.js expectations
            return response()->json([
                'success' => true,
                'data' => [
                    'email' => $customer['email'],
                    'name' => trim(($customer['firstName'] ?? '') . ' ' . ($customer['lastName'] ?? '')),
                    'id' => $customer['id'],
                    'phone' => $customer['phone'],
                    'createdAt' => $customer['createdAt'],
                    'updatedAt' => $customer['updatedAt'],
                    'numberOfOrders' => $customer['numberOfOrders'],
                    'orders' => array_map(fn($edge) => $edge['node'], $customer['orders']['edges']),
                    'image' => $customer['image'] ?? null,
                    'state' => $customer['state'],
                    'amountSpent' => $customer['amountSpent'],
                    'verifiedEmail' => $customer['verifiedEmail'],
                    'taxExempt' => $customer['taxExempt'],
                    'tags' => $customer['tags'],
                    'addresses' => $customer['addresses'],
                    'defaultAddress' => $customer['defaultAddress'],
                ],
                'subscriptions' => array_values($filteredSubscriptions)
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching Shopify customer', [
                'email' => $email,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $errorMessage = $e->getMessage();
            $statusCode = $errorMessage === 'Invalid token' ? 401 : 500;

            return response()->json([
                'success' => false,
                'error' => $errorMessage,
            ], $statusCode);
        }
    }

    /**
     * Map GraphQL error codes to HTTP status codes
     */
    private function mapGraphQLErrorCodeToStatus(string $errorCode): int
    {
        switch ($errorCode) {
            case 'undefinedField':
                return 400; // Bad Request for invalid query
            case 'accessDenied':
                return 401; // Unauthorized
            case 'throttled':
                return 429; // Too Many Requests
            default:
                return 500; // Internal Server Error
        }
    }
}