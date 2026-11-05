<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ClassLevel;
use App\Models\StudentProfile;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminClassLevelController extends Controller
{
    /**
     * Public / authenticated active list of class levels for dropdowns.
     */
    public function publicList(): JsonResponse
    {
        $levels = ClassLevel::active()
            ->ordered()
            ->get(['id', 'name', 'slug', 'category', 'description', 'sort_order']);

        return response()->json($levels);
    }

    /**
     * Admin list of all class levels with student counts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ClassLevel::withCount('studentProfiles')->ordered();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json($query->get());
    }

    /**
     * Store a new master class level.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:class_levels,name',
            'slug' => 'nullable|string|max:100|unique:class_levels,slug',
            'category' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        if (ClassLevel::where('slug', $slug)->exists()) {
            $slug .= '-'.Str::lower(Str::random(4));
        }

        $maxOrder = (int) ClassLevel::max('sort_order');

        $classLevel = ClassLevel::create([
            'name' => trim($validated['name']),
            'slug' => $slug,
            'category' => $validated['category'] ?? 'SMA/MA/SMK',
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? ($maxOrder + 1),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AuditLog::record(
            'CREATE_CLASS_LEVEL',
            "Menambahkan master tingkat kelas '{$classLevel->name}'.",
            'system',
            $classLevel
        );

        return response()->json([
            'message' => 'Master tingkat kelas berhasil ditambahkan.',
            'class_level' => $classLevel->loadCount('studentProfiles'),
        ], 201);
    }

    /**
     * Update an existing master class level and sync student profile labels.
     */
    public function update(Request $request, ClassLevel $classLevel): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('class_levels', 'name')->ignore($classLevel->id)],
            'slug' => ['nullable', 'string', 'max:100', Rule::unique('class_levels', 'slug')->ignore($classLevel->id)],
            'category' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $oldName = $classLevel->name;
        $newName = isset($validated['name']) ? trim($validated['name']) : $classLevel->name;

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : ($newName !== $oldName ? Str::slug($newName) : $classLevel->slug);

        if ($slug !== $classLevel->slug && ClassLevel::where('slug', $slug)->where('id', '!=', $classLevel->id)->exists()) {
            $slug .= '-'.$classLevel->id;
        }

        $classLevel->update([
            'name' => $newName,
            'slug' => $slug,
            'category' => array_key_exists('category', $validated) ? $validated['category'] : $classLevel->category,
            'description' => array_key_exists('description', $validated) ? $validated['description'] : $classLevel->description,
            'sort_order' => array_key_exists('sort_order', $validated) ? (int) $validated['sort_order'] : $classLevel->sort_order,
            'is_active' => array_key_exists('is_active', $validated) ? (bool) $validated['is_active'] : $classLevel->is_active,
        ]);

        // Synchronize student_profiles and user_profiles if the display name changed
        if ($oldName !== $newName) {
            StudentProfile::where('class_level_id', $classLevel->id)->update(['class_level' => $newName]);
            UserProfile::where('class_level_id', $classLevel->id)->update(['class_level' => $newName]);
        }

        AuditLog::record(
            'UPDATE_CLASS_LEVEL',
            "Memperbarui master tingkat kelas '{$classLevel->name}'.",
            'system',
            $classLevel
        );

        return response()->json([
            'message' => 'Master tingkat kelas berhasil diperbarui.',
            'class_level' => $classLevel->fresh()->loadCount('studentProfiles'),
        ]);
    }

    /**
     * Delete a master class level.
     */
    public function destroy(ClassLevel $classLevel): JsonResponse
    {
        $name = $classLevel->name;
        $classLevel->delete();

        AuditLog::record(
            'DELETE_CLASS_LEVEL',
            "Menghapus master tingkat kelas '{$name}'.",
            'system'
        );

        return response()->json([
            'message' => 'Master tingkat kelas berhasil dihapus.',
        ]);
    }
}

