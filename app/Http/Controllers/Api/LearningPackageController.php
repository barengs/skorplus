<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearningPackage;

class LearningPackageController extends Controller
{
    public function index()
    {
        $packages = LearningPackage::with('courses')
            ->where('is_published', true)
            ->get();

        return response()->json($packages);
    }
}
