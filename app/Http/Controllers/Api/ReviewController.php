<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
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
     * Get reviews for a program.
     */
    public function programReviews(string $slugOrId): JsonResponse
    {
        $program = is_numeric($slugOrId)
            ? Program::findOrFail($slugOrId)
            : Program::where('slug', $slugOrId)->firstOrFail();

        $reviews = $program->reviews()
            ->with(['user' => function ($query) {
                $query->select('id', 'name', 'avatar', 'school', 'target_university');
            }])
            ->where('is_published', true)
            ->latest()
            ->get();

        $user = auth('api')->user();
        $userReview = $user ? $program->reviews()->where('user_id', $user->id)->first() : null;

        return response()->json([
            'rating' => (float) $program->rating,
            'total_reviews' => (int) $program->total_reviews,
            'reviews' => $reviews,
            'user_review' => $userReview,
        ]);
    }

    /**
     * Store or update a review for a program.
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

        $program = is_numeric($slugOrId)
            ? Program::findOrFail($slugOrId)
            : Program::where('slug', $slugOrId)->firstOrFail();

        $review = Review::updateOrCreate(
            [
                'user_id' => $user->id,
                'reviewable_type' => Program::class,
                'reviewable_id' => $program->id,
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'is_published' => true,
            ]
        );

        Review::recalculateFor($program);
        $program->refresh();

        return response()->json([
            'message' => 'Testimoni program berhasil disimpan! Terima kasih atas ulasan Anda.',
            'review' => $review->load(['user:id,name,avatar,school']),
            'rating' => (float) $program->rating,
            'total_reviews' => (int) $program->total_reviews,
        ], 200);
    }
}
