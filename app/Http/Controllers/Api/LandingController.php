<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\LandingHero;
use App\Models\LandingPromo;
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

        return response()->json([
            'hero' => LandingHero::where('is_active', true)->latest()->first(),
            'promo' => LandingPromo::where('is_active', true)->latest()->first(),
            'stats' => Stat::where('is_active', true)->orderBy('sort_order')->get(),
            'features' => Feature::where('is_active', true)->orderBy('sort_order')->get(),
            'testimonials' => $testimonials,
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

        $user = auth('api')->user();
        $userCbtUsage = null;
        if ($user) {
            $userCbtUsage = $program->getCbtUsageForUser($user);
        }

        return response()->json([
            'program' => $program,
            'courses' => $program->courses,
            'all_programs' => $allPrograms,
            'user_cbt_usage' => $userCbtUsage,
        ]);
    }
}
