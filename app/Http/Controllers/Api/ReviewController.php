<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LearningPackage;
use App\Models\Program;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Get reviews for a course.
     */
    public function courseReviews(string|int $courseId): JsonResponse
    {
        $course = is_numeric($courseId)
            ? Course::findOrFail($courseId)
            : Course::where('slug', $courseId)->firstOrFail();

        $reviews = $course->reviews()
            ->with(['user' => function ($query) {
                $query->select('id', 'name', 'avatar', 'school', 'target_university');
            }])
            ->where('is_published', true)
            ->latest()
            ->get();

        $user = auth('api')->user();
        $userReview = $user ? $course->reviews()->where('user_id', $user->id)->first() : null;

        return response()->json([
            'rating' => (float) $course->rating,
            'total_reviews' => (int) $course->total_reviews,
            'reviews' => $reviews,
            'user_review' => $userReview,
        ]);
    }

    /**
     * Store or update a review for a course.
     */
    public function storeCourseReview(Request $request, string|int $courseId): JsonResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = auth('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $course = is_numeric($courseId)
            ? Course::findOrFail($courseId)
            : Course::where('slug', $courseId)->firstOrFail();

        $review = Review::updateOrCreate(
            [
                'user_id' => $user->id,
                'reviewable_type' => Course::class,
                'reviewable_id' => $course->id,
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'is_published' => true,
            ]
        );

        Review::recalculateFor($course);
        $course->refresh();

        return response()->json([
            'message' => 'Testimoni kursus berhasil disimpan! Terima kasih atas ulasan Anda.',
            'review' => $review->load(['user:id,name,avatar,school']),
            'rating' => (float) $course->rating,
            'total_reviews' => (int) $course->total_reviews,
        ], 200);
    }

    /**
     * Resolve a program or learning package by slug or ID.
     */
    private function resolveProgramOrPackage(string $slugOrId): mixed
    {
        $cleanSlug = str_replace('program-', '', strtolower($slugOrId));

        $program = Program::where('slug', $slugOrId)
            ->orWhere('slug', $cleanSlug)
            ->orWhereRaw('LOWER(name) = ?', [$cleanSlug])
            ->orWhereRaw('LOWER(name) = ?', [strtolower(str_replace('-', ' ', $slugOrId))])
            ->when(is_numeric($slugOrId), fn ($q) => $q->orWhere('id', $slugOrId))
            ->first();

        if ($program) {
            return $program;
        }

        $package = LearningPackage::where('slug', $slugOrId)
            ->orWhere('slug', $cleanSlug)
            ->orWhereRaw('LOWER(name) = ?', [$cleanSlug])
            ->orWhereRaw('LOWER(name) = ?', [strtolower(str_replace('-', ' ', $slugOrId))])
            ->when(is_numeric($slugOrId), fn ($q) => $q->orWhere('id', $slugOrId))
            ->first();

        return $package;
    }

    /**
     * Get reviews for a program or learning package.
     */
    public function programReviews(string $slugOrId): JsonResponse
    {
        $target = $this->resolveProgramOrPackage($slugOrId);

        if (! $target) {
            return response()->json([
                'rating' => 0.0,
                'total_reviews' => 0,
                'reviews' => [],
                'user_review' => null,
            ]);
        }

        $reviews = method_exists($target, 'reviews')
            ? $target->reviews()
                ->with(['user' => function ($query) {
                    $query->select('id', 'name', 'avatar', 'school', 'target_university');
                }])
                ->where('is_published', true)
                ->latest()
                ->get()
            : collect([]);

        $user = auth('api')->user();
        $userReview = ($user && method_exists($target, 'reviews'))
            ? $target->reviews()->where('user_id', $user->id)->first()
            : null;

        return response()->json([
            'rating' => (float) ($target->rating ?? 0.0),
            'total_reviews' => (int) ($target->total_reviews ?? 0),
            'reviews' => $reviews,
            'user_review' => $userReview,
        ]);
    }

    /**
     * Store or update a review for a program or learning package.
     */
    public function storeProgramReview(Request $request, string $slugOrId): JsonResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = auth('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $target = $this->resolveProgramOrPackage($slugOrId);
        if (! $target) {
            return response()->json(['message' => 'Program atau paket tidak ditemukan'], 404);
        }

        $review = Review::updateOrCreate(
            [
                'user_id' => $user->id,
                'reviewable_type' => get_class($target),
                'reviewable_id' => $target->id,
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'is_published' => true,
            ]
        );

        Review::recalculateFor($target);
        $target->refresh();

        return response()->json([
            'message' => 'Testimoni program berhasil disimpan! Terima kasih atas ulasan Anda.',
            'review' => $review->load(['user:id,name,avatar,school']),
            'rating' => (float) ($target->rating ?? 0.0),
            'total_reviews' => (int) ($target->total_reviews ?? 0),
        ], 200);
    }
}
