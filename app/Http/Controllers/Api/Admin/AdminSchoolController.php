<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class AdminSchoolController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = School::withCount(['students', 'admins']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('npsn', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $schools = $query->latest()->get();

        return response()->json($schools);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'npsn' => 'nullable|string|max:30|unique:schools,npsn',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
            'is_active' => 'boolean',
            // Optional initial school admin creation
            'admin_name' => 'nullable|string|max:255',
            'admin_email' => 'nullable|email|max:255|unique:users,email',
            'admin_password' => 'nullable|string|min:6',
        ]);

        $school = School::create([
            'name' => $validated['name'],
            'npsn' => $validated['npsn'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'logo' => $validated['logo'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // If admin credentials provided, create the admin account
        if (! empty($validated['admin_email'])) {
            $adminUser = User::create([
                'name' => $validated['admin_name'] ?: 'Admin '.$school->name,
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password'] ?: 'password123'),
                'school' => $school->name,
                'school_id' => $school->id,
                'is_active' => true,
            ]);

            $adminRole = Role::firstOrCreate(['name' => 'admin_sekolah', 'guard_name' => 'api']);
            $adminUser->assignRole($adminRole);
        }

        $school->loadCount(['students', 'admins']);

        return response()->json($school, 201);
    }

    public function show(School $school): JsonResponse
    {
        $school->loadCount(['students', 'admins']);
        $school->load([
            'admins' => function ($q) {
                $q->select('id', 'name', 'email', 'phone', 'school_id', 'is_active', 'created_at');
            },
        ]);

        return response()->json($school);
    }

    public function update(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'npsn' => ['nullable', 'string', 'max:30', Rule::unique('schools', 'npsn')->ignore($school->id)],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $school->update($validated);
        $school->loadCount(['students', 'admins']);

        return response()->json($school);
    }

    public function destroy(School $school): JsonResponse
    {
        $school->delete();

        return response()->json(['message' => 'Sekolah berhasil dihapus']);
    }

    public function createAdmin(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:30',
        ]);

        $adminUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'school' => $school->name,
            'school_id' => $school->id,
            'is_active' => true,
        ]);

        $adminRole = Role::firstOrCreate(['name' => 'admin_sekolah', 'guard_name' => 'api']);
        $adminUser->assignRole($adminRole);

        return response()->json([
            'message' => 'Akun Admin Sekolah berhasil dibuat',
            'user' => $adminUser,
        ], 201);
    }
}
