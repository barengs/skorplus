<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['roles', 'profile', 'studentProfile', 'tutorProfile', 'schoolAdminProfile', 'adminProfile']);

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        if ($request->program) {
            $query->where('program', $request->program);
        }

        if ($request->class_level) {
            $cl = $request->class_level;
            $query->where(function ($q) use ($cl) {
                $q->whereHas('studentProfile', function ($sq) use ($cl) {
                    $sq->where('class_level', $cl)->orWhere('class_level_id', $cl);
                })->orWhereHas('profile', function ($pq) use ($cl) {
                    $pq->where('class_level', $cl)->orWhere('class_level_id', $cl);
                });
            });
        }

        $users = $query->latest()->get()->map(function (User $user) {
            return $this->formatUserPayload($user);
        });

        return response()->json($users);
    }

    private function formatUserPayload(User $user): array
    {
        $user->loadMissing(['roles', 'profile', 'studentProfile', 'tutorProfile', 'schoolAdminProfile', 'adminProfile', 'schoolEntity']);
        $resolved = $user->resolvedProfileAttributes();
        $data = $user->toArray();
        $data['roles'] = $user->getRoleNames();
        $data['profile_type'] = $resolved['profile_type'];
        $data['phone'] = $resolved['phone'];
        $data['gender'] = $resolved['gender'];
        $data['birth_year'] = $resolved['birth_year'];
        $data['address'] = $resolved['address'];
        $data['social_media'] = $resolved['social_media'] ?? [];
        $data['bio'] = $resolved['bio'];
        $data['class_level_id'] = $resolved['class_level_id'];
        $data['class_level'] = $resolved['class_level'];
        $data['target_campus'] = $resolved['target_campus'];
        $data['specialization'] = $resolved['specialization'];
        $data['alma_mater'] = $resolved['alma_mater'];
        $data['position'] = $resolved['position'];
        $data['department'] = $resolved['department'];
        $data['nip'] = $resolved['nip'];
        $data['is_on_trial'] = $user->isOnTrial();
        $data['trial_days_remaining'] = $user->trialDaysRemaining();
        $data['school_name'] = $user->schoolEntity?->name ?? $user->school;

        return $data;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'program' => 'nullable|string',
            'phone' => 'nullable|string',
            'school' => 'nullable|string',
            'school_id' => 'nullable|integer|exists:schools,id',
            'nisn' => 'nullable|string|unique:users',
            'class_level_id' => 'nullable|integer|exists:class_levels,id',
            'class_level' => 'nullable|string|max:100',
            'target_campus' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'alma_mater' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'nip' => 'nullable|string|max:50',
            'gender' => 'nullable|string|in:laki-laki,perempuan',
            'birth_year' => 'nullable|integer',
            'address' => 'nullable|string',
            'social_media' => 'nullable|array',
            'bio' => 'nullable|string',
            'is_active' => 'boolean',
            'role' => 'nullable|string|exists:roles,name',
        ]);

        $validated['password'] = Hash::make('password123'); // Default password

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'program' => $validated['program'] ?? 'mandiri',
            'phone' => $validated['phone'] ?? null,
            'school' => $validated['school'] ?? null,
            'school_id' => $validated['school_id'] ?? null,
            'nisn' => $validated['nisn'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $roleName = $validated['role'] ?? 'siswa';
        $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
        if ($role) {
            $user->assignRole($role);
        }

        $user->syncRoleProfile([
            'role' => $roleName,
            'phone' => $validated['phone'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_year' => $validated['birth_year'] ?? null,
            'address' => $validated['address'] ?? null,
            'social_media' => $validated['social_media'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'class_level_id' => $validated['class_level_id'] ?? null,
            'class_level' => $validated['class_level'] ?? null,
            'target_campus' => $validated['target_campus'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'alma_mater' => $validated['alma_mater'] ?? null,
            'position' => $validated['position'] ?? null,
            'department' => $validated['department'] ?? null,
            'nip' => $validated['nip'] ?? null,
        ]);

        return response()->json($this->formatUserPayload($user->fresh()), 201);
    }

    public function show(User $user)
    {
        $user->load(['roles', 'profile', 'studentProfile', 'tutorProfile', 'schoolAdminProfile', 'adminProfile', 'schoolEntity', 'cbtSessions' => function ($q) {
            $q->with('exam')->latest()->take(10);
        }]);

        return response()->json($this->formatUserPayload($user));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,'.$user->id,
            'program' => 'nullable|string',
            'phone' => 'nullable|string',
            'school' => 'nullable|string',
            'school_id' => 'nullable|integer|exists:schools,id',
            'nisn' => 'nullable|string|unique:users,nisn,'.$user->id,
            'class_level_id' => 'nullable|integer|exists:class_levels,id',
            'class_level' => 'nullable|string|max:100',
            'target_campus' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'alma_mater' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'nip' => 'nullable|string|max:50',
            'gender' => 'nullable|string|in:laki-laki,perempuan',
            'birth_year' => 'nullable|integer',
            'address' => 'nullable|string',
            'social_media' => 'nullable|array',
            'bio' => 'nullable|string',
            'is_active' => 'boolean',
            'role' => 'nullable|string|exists:roles,name',
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
            'program' => $validated['program'] ?? $user->program,
            'phone' => $validated['phone'] ?? $user->phone,
            'school' => $validated['school'] ?? $user->school,
            'school_id' => array_key_exists('school_id', $validated) ? $validated['school_id'] : $user->school_id,
            'nisn' => $validated['nisn'] ?? $user->nisn,
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ]);

        if (isset($validated['role'])) {
            $role = Role::where('name', $validated['role'])->where('guard_name', 'api')->first();
            if ($role) {
                $user->syncRoles([$role]);
            }
        }

        $profileInput = $request->only([
            'phone',
            'gender',
            'birth_year',
            'address',
            'social_media',
            'bio',
            'class_level_id',
            'class_level',
            'target_campus',
            'specialization',
            'alma_mater',
            'position',
            'department',
            'nip',
            'role',
        ]);
        $user->syncRoleProfile($profileInput);

        return response()->json($this->formatUserPayload($user->fresh()));
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
