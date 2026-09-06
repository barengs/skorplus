<?php

use Illuminate\Support\Facades\Route;

// Catch-all route — React Router handles all frontend navigation
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
