<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ForumPost;
use App\Models\ForumReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ForumController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ForumPost::with(['user:id,name,school', 'replies'])
            ->withCount('replies')
            ->latest();

        if ($request->subject && $request->subject !== 'semua') {
            $query->where('subject', $request->subject);
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
            'subject' => 'required|string|max:100',
            'title'   => 'required|string|max:255',
            'content' => 'required|string|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $post = ForumPost::create([
            'user_id' => auth('api')->id(),
            'subject' => $request->subject,
            'title'   => $request->title,
            'content' => $request->content,
        ]);

        $post->load('user:id,name,school');

        return response()->json(['post' => $post], 201);
    }

    public function show(ForumPost $post): JsonResponse
    {
        $post->increment('views_count');
        $post->load(['user:id,name,school,avatar', 'replies.user:id,name,avatar']);

        return response()->json(['post' => $post]);
    }

    public function reply(Request $request, ForumPost $post): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        $isTutor = $user->hasRole('tutor') || $user->hasRole('admin');

        $reply = ForumReply::create([
            'forum_post_id'   => $post->id,
            'user_id'         => $user->id,
            'content'         => $request->content,
            'is_tutor_answer' => $isTutor,
        ]);

        if ($isTutor && ! $post->answered_at) {
            $post->update(['answered_at' => now()]);
        }

        $reply->load('user:id,name,avatar');

        return response()->json(['reply' => $reply], 201);
    }
}
