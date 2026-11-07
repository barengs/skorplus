<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\LandingHero;
use App\Models\LandingPromo;
use App\Models\LearningPackage;
use App\Models\Program;
use App\Models\Review;
use App\Models\Stat;
use App\Models\Testimonial;

class LandingController extends Controller
{
    public function index()
    {
        $studentReviews = Review::where('is_published', true)
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->with(['user', 'reviewable'])
            ->latest()
            ->take(15)
            ->get();

        $colors = [
            'from-blue-500 to-violet-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-amber-600',
            'from-violet-500 to-pink-600',
            'from-indigo-500 to-cyan-500',
            'from-rose-500 to-amber-500',
        ];

        // Also fetch any known PTN acceptance or high scores from Testimonial table to enrich matching users
        $testimonialsByName = Testimonial::all()->keyBy(fn ($item) => strtolower(trim($item->name)));

        $testimonials = $studentReviews->map(function ($r, $idx) use ($colors, $testimonialsByName) {
            $user = $r->user;
            $target = $r->reviewable;
            $targetTitle = $target?->title ?? $target?->name ?? 'Program SkorPluss';
            $targetType = ($r->reviewable_type === Program::class) ? 'Program' : 'Kursus';

            $name = $user?->name ?? 'Siswa SkorPluss';
            $school = $user?->school ?? ($user?->program ? 'Program '.ucfirst($user->program) : 'Siswa SkorPluss');

            // Match PTN acceptance & UTBK score if recorded
            $matchedTestimonial = $testimonialsByName->get(strtolower(trim($name)));
            $university = $matchedTestimonial?->university;
            $score = $matchedTestimonial?->score;

            $words = explode(' ', trim($name));
            $avatarText = count($words) >= 2
                ? strtoupper(substr($words[0], 0, 1).substr($words[1], 0, 1))
                : strtoupper(substr($name, 0, 2));

            return [
                'id' => $r->id,
                'name' => $name,
                'school' => $school,
                'university' => $university,
                'avatar' => $user?->avatar,
                'avatar_text' => $avatarText ?: 'SP',
                'avatar_color' => $colors[$idx % count($colors)],
                'rating' => (int) $r->rating,
                'comment' => $r->comment,
                'content' => $r->comment,
                'target_title' => $targetTitle,
                'target_type' => $targetType,
                'score' => $score,
                'date_formatted' => $r->created_at ? $r->created_at->translatedFormat('d M Y') : null,
                'is_from_student_review' => true,
            ];
        });

        if ($testimonials->isEmpty()) {
            $testimonials = Testimonial::where('is_active', true)->orderBy('sort_order')->get();
        }

        $learningPackages = LearningPackage::with(['courses' => function ($q) {
            $q->where('is_active', true)->orderBy('sort_order');
        }, 'exams'])
            ->where('is_published', true)
            ->get();

        return response()->json([
            'hero' => LandingHero::where('is_active', true)->latest()->first(),
            'promo' => LandingPromo::where('is_active', true)->latest()->first(),
            'stats' => Stat::where('is_active', true)->orderBy('sort_order')->get(),
            'features' => Feature::where('is_active', true)->orderBy('sort_order')->get(),
            'testimonials' => $testimonials,
            'learning_packages' => $learningPackages,
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

        // 1. Check in Program first (lightweight lookup)
        $program = Program::where('slug', $slug)
            ->orWhere('slug', $cleanSlug)
            ->orWhereRaw('LOWER(name) = ?', [$cleanSlug])
            ->orWhereRaw('LOWER(name) = ?', [strtolower(str_replace('-', ' ', $slug))])
            ->when(is_numeric($slug), fn ($q) => $q->orWhere('id', $slug))
            ->first();

        if ($program) {
            $program->load(['courses' => $courseEagerLoad]);
            $allPrograms = Program::where('is_active', true)->orderBy('sort_order')->get();

            $user = auth('api')->user();
            $userCbtUsage = $user ? $program->getCbtUsageForUser($user) : null;

            return response()->json([
                'program' => $program,
                'courses' => $program->courses,
                'all_programs' => $allPrograms,
                'user_cbt_usage' => $userCbtUsage,
            ]);
        }

        // 2. Check in LearningPackage (Manajemen Paket)
        $pkg = LearningPackage::where('slug', $slug)
            ->orWhere('slug', $cleanSlug)
            ->orWhereRaw('LOWER(name) = ?', [$cleanSlug])
            ->orWhereRaw('LOWER(name) = ?', [strtolower(str_replace('-', ' ', $slug))])
            ->when(is_numeric($slug), fn ($q) => $q->orWhere('id', $slug))
            ->first();

        if ($pkg) {
            $pkg->load(['courses' => $courseEagerLoad, 'exams']);

            $allPackages = LearningPackage::where('is_published', true)->get()->map(function ($p) {
                $hasDiscount = $p->discount_price && $p->discount_price < $p->price;

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'price' => 'Rp '.number_format($hasDiscount ? $p->discount_price : $p->price, 0, ',', '.'),
                    'price_period' => '/paket',
                    'features' => $p->features ?? [],
                    'icon' => '📦',
                ];
            });

            $hasDiscount = $pkg->discount_price && $pkg->discount_price < $pkg->price;
            $displayPrice = 'Rp '.number_format($hasDiscount ? $pkg->discount_price : $pkg->price, 0, ',', '.');

            $user = auth('api')->user();
            $userCbtUsage = $user ? $pkg->getCbtUsageForUser($user) : null;

            $adaptedProgram = (object) [
                'id' => $pkg->id,
                'name' => $pkg->name,
                'slug' => $pkg->slug,
                'description' => $pkg->description,
                'price' => $displayPrice,
                'price_period' => '/paket',
                'features' => $pkg->features ?? [],
                'color' => 'from-blue-700 to-violet-700',
                'ring_color' => 'ring-blue-400',
                'is_popular' => true,
                'courses' => $pkg->courses,
                'exams' => $pkg->exams,
                'cbt_quota' => $pkg->cbt_quota,
            ];

            return response()->json([
                'program' => $adaptedProgram,
                'courses' => $pkg->courses,
                'all_programs' => $allPackages,
                'user_cbt_usage' => $userCbtUsage,
            ]);
        }

        abort(404, 'Paket atau Program tidak ditemukan');
    }
}
