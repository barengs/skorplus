<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth('api')->user();

        $totalSessions = CbtSession::where('user_id', $user->id)->count();
        $bestScore = CbtSession::where('user_id', $user->id)
            ->where('status', 'submitted')
            ->max('score') ?? 0;
        $recentSessions = CbtSession::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get(['id', 'exam_title', 'exam_type', 'score', 'status', 'submitted_at', 'created_at']);

        return response()->json([
            'user'           => [
                'name'    => $user->name,
                'program' => $user->program,
                'nisn'    => $user->nisn,
                'school'  => $user->school,
            ],
            'stats' => [
                'total_sessions' => $totalSessions,
                'best_score'     => $bestScore,
                'completed'      => CbtSession::where('user_id', $user->id)->where('status', 'submitted')->count(),
            ],
            'recent_sessions' => $recentSessions,
        ]);
    }
}
