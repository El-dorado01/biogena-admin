<?php

use App\Models\SubscriptionRestart;
use Carbon\Carbon;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'auth0.verify' => \App\Http\Middleware\CheckAuth0Token::class,
        ]);
        // $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function (Schedule $schedule) {
        $schedule->call(function () {
            $today = Carbon::today()->toDateString();
            $restarts = SubscriptionRestart::where('restart_date', $today)->get();

            foreach ($restarts as $restart) {
                $subscription_id = $restart->subscription_id;

                $sealApiUrl = config('services.seal.api_base_url') . 'subscription';
                $sealApiToken = config('services.seal.api_token');

                $response = Http::withHeaders([
                    'X-Seal-Token' => $sealApiToken,
                    'Content-Type' => 'application/json',
                ])->put($sealApiUrl, [
                    'id' => (int) $subscription_id,
                    'action' => 'resume',
                ]);

                if ($response->successful()) {
                    \Log::info('Subscription resumed via scheduler', ['id' => $subscription_id]);
                    $restart->delete(); // Remove from database
                } else {
                    \Log::error('Failed to resume subscription via scheduler', [
                        'id' => $subscription_id,
                        'error' => $response->json()['error'] ?? 'Unknown error',
                    ]);
                }
            }
        })->daily()->at('00:01');
    })
    ->create();
