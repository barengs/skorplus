<?php

namespace App\Http\Controllers\Api;

use App\Models\LearningPackage;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

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
