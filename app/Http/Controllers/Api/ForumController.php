<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ForumPost;
use App\Models\ForumReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ForumController extends Controller
{
    public function courses(): JsonResponse
    {
        $courses = Course::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'title', 'slug', 'category']);

        return response()->json($courses);
    }

    public function index(Request $request): JsonResponse
    {
        $query = ForumPost::with(['user:id,name,school', 'course:id,title,slug', 'replies'])
            ->withCount('replies')
            ->latest();

        if ($request->subject && $request->subject !== 'semua') {
            $query->where(function ($q) use ($request) {
                $q->where('subject', $request->subject)
                    ->orWhere('course_id', $request->subject);
            });
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                    ->orWhere('content', 'like', "%{$request->search}%");
            });
        }

        $posts = $query->paginate(10);

        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'course_id' => 'nullable|exists:courses,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $courseId = $request->input('course_id');
        $subject = $request->input('subject');

        if (! $courseId && $subject) {
            $course = Course::where('title', $subject)->orWhere('slug', $subject)->first();
            $courseId = $course?->id;
        } elseif ($courseId && ! $subject) {
            $course = Course::find($courseId);
            $subject = $course?->title ?? 'Umum';
        }

        $post = ForumPost::create([
            'user_id' => auth('api')->id(),
            'course_id' => $courseId,
            'subject' => $subject,
            'title' => $request->title,
            'content' => $request->input('content'),
        ]);

        $post->load(['user:id,name,school', 'course:id,title,slug']);

        return response()->json(['post' => $post], 201);
    }

    public function show(ForumPost $post): JsonResponse
    {
        $post->increment('views_count');
        $post->load([
            'user:id,name,school,avatar',
            'course:id,title,slug',
            'replies' => function ($q) {
                $q->with([
                    'user:id,name,school,avatar',
                    'parent.user:id,name',
                ])->oldest();
            },
        ]);

        return response()->json(['post' => $post]);
    }

    public function reply(Request $request, ForumPost $post): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:3',
            'parent_id' => 'nullable|exists:forum_replies,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        $isTutor = $user->hasRole('tutor') || $user->hasRole('admin');

        $reply = ForumReply::create([
            'forum_post_id' => $post->id,
            'parent_id' => $request->input('parent_id'),
            'user_id' => $user->id,
            'content' => $request->input('content'),
            'is_tutor_answer' => $isTutor,
        ]);

        if ($isTutor && ! $post->answered_at) {
            $post->update(['answered_at' => now()]);
        }

        $reply->load(['user:id,name,school,avatar', 'parent.user:id,name']);

        return response()->json(['reply' => $reply], 201);
    }
}
