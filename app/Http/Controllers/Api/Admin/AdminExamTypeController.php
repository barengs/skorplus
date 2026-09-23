<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExamType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminExamTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $types = ExamType::orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json($types);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:exam_types,code',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'duration_seconds' => 'nullable|integer|min:60|max:86400',
            'total_questions' => 'nullable|integer|min:1|max:500',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = Str::slug($validated['name']);
            // Ensure unique code
            $baseCode = $validated['code'];
            $counter = 1;
            while (ExamType::where('code', $validated['code'])->exists()) {
                $validated['code'] = "{$baseCode}-{$counter}";
                $counter++;
            }
        }

        $type = ExamType::create([
            'code' => strtolower($validated['code']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? '📝',
            'duration_seconds' => $validated['duration_seconds'] ?? 3600,
            'total_questions' => $validated['total_questions'] ?? 20,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? (ExamType::count() + 1),
        ]);

        return response()->json($type, 201);
    }

    public function show(int $id): JsonResponse
    {
        $type = ExamType::findOrFail($id);

        return response()->json($type);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $type = ExamType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => "sometimes|required|string|max:50|unique:exam_types,code,{$id}",
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'duration_seconds' => 'nullable|integer|min:60|max:86400',
            'total_questions' => 'nullable|integer|min:1|max:500',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtolower($validated['code']);
        }

        $type->update($validated);

        return response()->json($type);
    }

    public function destroy(int $id): JsonResponse
    {
        $type = ExamType::findOrFail($id);
        $type->delete();

        return response()->json(['message' => 'Tipe ujian berhasil dihapus.'], 200);
    }
}
