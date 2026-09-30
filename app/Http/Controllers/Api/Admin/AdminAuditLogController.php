<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    /**
     * Display a paginated listing of audit logs with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->with('user:id,name,email');

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('action')) {
            $query->where('action', strtoupper($request->action));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('user_name', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->latest()->paginate($request->input('per_page', 20));

        return response()->json($logs);
    }

    /**
     * Display statistics summary of audit logs.
     */
    public function stats(): JsonResponse
    {
        $totalLogs = AuditLog::count();
        $todayLogs = AuditLog::whereDate('created_at', today())->count();

        $moduleStats = AuditLog::selectRaw('module, COUNT(*) as total')
            ->groupBy('module')
            ->orderByDesc('total')
            ->get();

        $actionStats = AuditLog::selectRaw('action, COUNT(*) as total')
            ->groupBy('action')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $recentActiveUsers = AuditLog::selectRaw('user_id, user_name, COUNT(*) as total_actions')
            ->whereNotNull('user_id')
            ->groupBy('user_id', 'user_name')
            ->orderByDesc('total_actions')
            ->limit(10)
            ->get();

        return response()->json([
            'total_logs' => $totalLogs,
            'today_logs' => $todayLogs,
            'module_stats' => $moduleStats,
            'action_stats' => $actionStats,
            'recent_active_users' => $recentActiveUsers,
        ]);
    }

    /**
     * Display the specified audit log.
     */
    public function show(AuditLog $auditLog): JsonResponse
    {
        $auditLog->load('user:id,name,email');

        return response()->json($auditLog);
    }
}
