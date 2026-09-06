<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Program;
use App\Models\Testimonial;
use App\Models\Feature;
use App\Models\Stat;
use App\Models\LandingHero;
use App\Models\LandingPromo;

class LandingController extends Controller
{
    public function index()
    {
        return response()->json([
            'hero' => LandingHero::where('is_active', true)->latest()->first(),
            'promo' => LandingPromo::where('is_active', true)->latest()->first(),
            'stats' => Stat::where('is_active', true)->orderBy('sort_order')->get(),
            'features' => Feature::where('is_active', true)->orderBy('sort_order')->get(),
            'testimonials' => Testimonial::where('is_active', true)->orderBy('sort_order')->get(),
            'programs' => Program::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }
}
