<?php

use App\Http\Controllers\Admin\HomeController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth0.verify')->prefix('admin')->group(function () {
    Route::get('/dashboard', [HomeController::class, 'adminDashboard']);
    Route::get('/customers', [CustomerController::class, 'getAllCustomers']);
    Route::get('/customers/{email}', [CustomerController::class, 'getACustomer']);
    Route::get('/subscriptions', [SubscriptionController::class, 'getAllSubscriptions']);
    Route::get('/subscriptions/{id}', [SubscriptionController::class, 'getSubscription']);

    Route::put('/subscriptions/{id}/pause', [SubscriptionController::class, 'performAction']);
    Route::put('/subscriptions/{id}/resume', [SubscriptionController::class, 'performAction']);
    Route::put('/subscriptions/{id}/cancel', [SubscriptionController::class, 'performAction']);
    Route::put('/subscriptions/{id}/reactivate', [SubscriptionController::class, 'performAction']);
    Route::put('/subscriptions/{id}/updateSubDetails', [SubscriptionController::class, 'updateSubDetails']);

    // Route::put('/subscriptions/{id}/address', [SubscriptionsController::class, 'updateAddress']);
    // Route::put('/subscriptions/{id}/skip-next', [SubscriptionsController::class, 'skipNext']);
});