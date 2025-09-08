<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionRestart;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    /**
     * Make a request to the Seal Subscriptions API with authentication and logging.
     */
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

    public function getAllSubscriptions (Request $request) {
        try {
            $status = $request->query('status');
            $query = ['with-items' => true];

            if ($status) {
                $upper = strtoupper($status);
                if ($upper === 'ACTIVE') {
                    $query['active-only'] = 'true';
                } elseif ($upper === 'PAUSED') {
                    $query['paused-only'] = 'true';
                } elseif ($upper === 'CANCELLED') {
                    $query['cancelled-only'] = 'true';
                }
            }

            Log::info('Fetching subscriptions for:', [
                'status' => $status ?: 'all',
                'query' => $query,
            ]);

            $responseData = $this->sealRequest('get', 'subscriptions', [], $query);

            if (isset($responseData['error'])) {
                Log::error('Seal API error in getSubscriptions:', [
                    'error' => $responseData['error'],
                    'status' => $responseData['status'],
                ]);
                return response()->json(['error' => $responseData['error']], $responseData['status']);
            }

            $subscriptions = $responseData['payload']['subscriptions'] ?? [];

            // Log::info('Subscriptions:', [
            //     'count' => count($subscriptions),
            //     'subscriptions' => $subscriptions,
            // ]);

            return response()->json(['success' => true, 'subscriptions' => $subscriptions], 200);
        } catch (\Exception $e) {
            Log::error('Get Subscriptions Error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to fetch subscriptions: ' . $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    public function performAction(Request $request, $id)
    {
        $action = $request->input('action');
        $restart_date = $request->input('restart_date');
        Log::info('Perform action:', ['action' => $action, 'id' => $id, 'restart_date' => $restart_date]);

        try {
            if (!is_numeric($id)) {
                return response()->json(['error' => 'Invalid subscription ID'], 400);
            }

            if (!in_array($action, ['pause', 'resume', 'cancel', 'reactivate'])) {
                return response()->json(['error' => 'Invalid action'], 400);
            }

            if ($action === 'pause' && $restart_date) {
                try {
                    $restartDate = Carbon::parse($restart_date);
                    $today = Carbon::today();
                    if ($restartDate->lessThanOrEqualTo($today)) {
                        return response()->json(['error' => 'restart_date must be a future date'], 400);
                    }

                    // Store in database
                    SubscriptionRestart::updateOrCreate([
                        'subscription_id' => $id,
                        'restart_date' => $restart_date,
                    ]);
                } catch (\Exception $e) {
                    return response()->json(['error' => 'Invalid restart_date format. Use YYYY-MM-DD'], 400);
                }
            }

            $subResponse = $this->sealRequest('get', 'subscription', [], ['id' => (int) $id]);
            if (isset($subResponse['error'])) {
                Log::warning('Failed to fetch subscription', ['id' => $id, 'error' => $subResponse['error']]);
                return response()->json(['error' => $subResponse['error']], $subResponse['status']);
            }

            if (!isset($subResponse['success']) || !$subResponse['success']) {
                Log::info('Subscription not found', ['id' => $id]);
                return response()->json(['error' => 'Subscription not found'], 404);
            }

            $payload = [
                'id' => (int) $id,
                'action' => $action,
            ];

            $responseData = $this->sealRequest('put', 'subscription', $payload);

            if (isset($responseData['error'])) {
                return response()->json(['error' => $responseData['error']], $responseData['status']);
            }

            if (!isset($responseData['success']) || !$responseData['success']) {
                Log::info($action . ' request failed', ['id' => $id, 'response' => $responseData]);
                return response()->json(['error' => 'Failed to ' . $action . ' subscription'], 400);
            }

            $newSubResponse = $this->sealRequest('get', 'subscription', [], ['id' => (int) $id]);
            if (isset($newSubResponse['error'])) {
                Log::warning('Failed to fetch subscription after ' . $action, ['id' => $id, 'error' => $newSubResponse['error']]);
                return response()->json(['error' => $newSubResponse['error']], $newSubResponse['status']);
            }

            $subscription = $newSubResponse['payload'] ?? '';
            if (!$subscription) {
                Log::info('Subscription not found after ' . $action, ['id' => $id]);
                return response()->json(['error' => 'Subscription not found'], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Subscription updated successfully',
                'subscription' => $subscription,
            ], 200);
        } catch (\Exception $e) {
            Log::error($action . ' Subscription Error:', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['error' => 'Failed to ' . $action . ' subscription: ' . $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    public function updateSubDetails(Request $request, $id)
    {
        $delivery_interval = $request->input('delivery_interval');
        $s_first_name = $request->input('s_first_name');
        $s_last_name = $request->input('s_last_name');
        $s_address1 = $request->input('s_address1');
        $s_zip = $request->input('s_zip');
        $s_city = $request->input('s_city');
        $s_country = $request->input('s_country');
        $s_province = $request->input('s_province');
        $s_address2 = $request->input('s_address2');
        $resetDate = $request->input('restartDate');

        Log::info('Perform action: ', ['delivery_interval' => $delivery_interval, 'id' => $id, 's_first_name' => $s_first_name, 's_address1' => $s_last_name, 's_last_name' => $s_address1, 's_zip' => $s_zip, 's_city' => $s_city, 's_country' => $s_country, 's_province' => $s_province, 's_address2' => $s_address2, 'restartDate' => $resetDate]);

        try {
            if (!is_numeric($id)) {
                return response()->json(['error' => 'Invalid subscription ID'], 400);
            }

            // if ($resetDate) {
            //     try {
            //         $restartDate = Carbon::parse($resetDate);
            //         $today = Carbon::today();
            //         if ($restartDate->lessThanOrEqualTo($today)) {
            //             return response()->json(['error' => 'resetDate must be a future date'], 400);
            //         }

            //         // Store in database
            //         SubscriptionRestart::updateOrCreate([
            //             'subscription_id' => $id,
            //             'restart_date' => $resetDate,
            //         ]);
            //     } catch (\Exception $e) {
            //         return response()->json(['error' => 'Invalid resetDate format. Use YYYY-MM-DD'], 400);
            //     }
            // }

            $subResponse = $this->sealRequest('get', 'subscription', [], ['id' => (int) $id]);
            if (isset($subResponse['error'])) {
                Log::warning('Failed to fetch subscription', ['id' => $id, 'error' => $subResponse['error']]);
                return response()->json(['error' => $subResponse['error']], $subResponse['status']);
            }

            if (!isset($subResponse['success']) || !$subResponse['success']) {
                Log::info('Subscription not found', ['id' => $id]);
                return response()->json(['error' => 'Subscription not found'], 404);
            }

             $request->validate([
                'delivery_interval' => 'string',
                's_first_name' => 'string',
                's_last_name' => 'string',
                's_address1' => 'string',
                's_zip' => 'string',
                's_city' => 'string',
                's_country' => 'string',
                's_province' => 'string',
                's_country_code' => 'string',
                's_province_code' => 'string',
                's_address2' => 'string|nullable',
            ]);

            $payload = [
                'id' => (int) $id,
                'action' => 'edit',
                'edit' => $request->only([
                    'delivery_interval',
                    's_first_name',
                    's_last_name',
                    's_address1',
                    's_zip', 
                    's_city',
                    's_country',
                    's_country_code',
                    's_province',
                    's_province_code',
                    's_address2',
                ]),
            ];

            $responseData = $this->sealRequest('put', 'subscription', $payload);

            if (isset($responseData['error'])) {
                return response()->json(['error' => $responseData['error']], $responseData['status']);
            }

            if (!isset($responseData['success']) || !$responseData['success']) {
                Log::info('Change delivery_interval request failed', ['id' => $id, 'response' => $responseData]);
                return response()->json(['error' => 'Failed to change delivery_interval'], 400);
            }

            $newSubResponse = $this->sealRequest('get', 'subscription', [], ['id' => (int) $id]);
            if (isset($newSubResponse['error'])) {
                Log::warning('Failed to fetch subscription after changing delivery_interval', ['id' => $id, 'error' => $newSubResponse['error']]);
                return response()->json(['error' => $newSubResponse['error']], $newSubResponse['status']);
            }

            $subscription = $newSubResponse['payload'] ?? '';
            if (!$subscription) {
                Log::info('Subscription not found after changing delivery_interval', ['id' => $id]);
                return response()->json(['error' => 'Subscription not found'], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Subscription term updated successfully',
                'subscription' => $subscription,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Change delivery_interval Error:', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['error' => 'Failed to change delivery_interval: ' . $e->getMessage()], $e->getCode() ?: 500);
        }
    }
}
