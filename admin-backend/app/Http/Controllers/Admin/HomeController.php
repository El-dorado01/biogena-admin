<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function adminDashboard(Request $request)
    {
        return response()->json([
            'success' => true, 
            'message' => 'Welcome to the Admin Dashboard!'
        ]);
    }   
}
