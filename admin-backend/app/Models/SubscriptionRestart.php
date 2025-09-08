<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionRestart extends Model
{
    protected $fillable = ['subscription_id', 'restart_date'];
}
