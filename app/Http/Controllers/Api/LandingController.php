<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\LandingHero;
use App\Models\LandingPromo;
use App\Models\Program;
use App\Models\Stat;
use App\Models\Testimonial;

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
            'programs' => Program::with(['courses' => function ($q) {
                $q->where('is_active', true)->orderBy('sort_order');
            }])->where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function programDetail($slug)
    {
        $cleanSlug = str_replace('program-', '', strtolower($slug));

        $courseEagerLoad = function ($q) {
            $q->where('is_active', true)
                ->withCount('enrollments')
                ->with(['modules' => function ($mq) {
                    $mq->orderBy('sort_order')->with(['lessons' => function ($lq) {
                        $lq->orderBy('sort_order');
                    }]);
                }])
                ->orderBy('sort_order');
        };

        $program = Program::with(['courses' => $courseEagerLoad])
            ->where('slug', $slug)
            ->orWhere('slug', $cleanSlug)
            ->orWhereRaw('LOWER(name) = ?', [$cleanSlug])
            ->orWhereRaw('LOWER(name) = ?', [strtolower(str_replace('-', ' ', $slug))])
            ->first();

        if (! $program && is_numeric($slug)) {
            $program = Program::with(['courses' => $courseEagerLoad])->where('id', $slug)->first();
        }

        if (! $program) {
            abort(404, 'Program tidak ditemukan');
        }

        $allPrograms = Program::where('is_active', true)->orderBy('sort_order')->get();

        return response()->json([
            'program' => $program,
            'courses' => $program->courses,
            'all_programs' => $allPrograms,
        ]);
    }
}
