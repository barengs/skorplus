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
        $query = User::with(['roles', 'profile']);

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

        $users = $query->latest()->get()->map(function (User $user) {
            $data = $user->toArray();
            $data['roles'] = $user->getRoleNames();
            $data['phone'] = $user->profile?->phone ?? $user->phone;
            $data['gender'] = $user->profile?->gender;
            $data['birth_year'] = $user->profile?->birth_year;
            $data['address'] = $user->profile?->address;
            $data['social_media'] = $user->profile?->social_media ?? [];
            $data['bio'] = $user->profile?->bio;

            return $data;
        });

        return response()->json($users);
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

        $user->profile()->create([
            'phone' => $validated['phone'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_year' => $validated['birth_year'] ?? null,
            'address' => $validated['address'] ?? null,
            'social_media' => $validated['social_media'] ?? null,
            'bio' => $validated['bio'] ?? null,
        ]);

        $roleName = $validated['role'] ?? 'siswa';
        $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
        if ($role) {
            $user->assignRole($role);
        }

        $data = $user->load('profile')->toArray();
        $data['roles'] = $user->getRoleNames();
        $data['phone'] = $user->profile?->phone ?? $user->phone;
        $data['gender'] = $user->profile?->gender;
        $data['birth_year'] = $user->profile?->birth_year;
        $data['address'] = $user->profile?->address;
        $data['social_media'] = $user->profile?->social_media ?? [];
        $data['bio'] = $user->profile?->bio;

        return response()->json($data, 201);
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

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'phone' => $request->has('phone') ? $request->phone : ($user->profile?->phone ?? $user->phone),
                'gender' => $request->has('gender') ? $request->gender : $user->profile?->gender,
                'birth_year' => $request->has('birth_year') ? $request->birth_year : $user->profile?->birth_year,
                'address' => $request->has('address') ? $request->address : $user->profile?->address,
                'social_media' => $request->has('social_media') ? $request->social_media : $user->profile?->social_media,
                'bio' => $request->has('bio') ? $request->bio : $user->profile?->bio,
            ]
        );

        if (isset($validated['role'])) {
            $role = Role::where('name', $validated['role'])->where('guard_name', 'api')->first();
            if ($role) {
                $user->syncRoles([$role]);
            }
        }

        $data = $user->fresh()->load('profile')->toArray();
        $data['roles'] = $user->getRoleNames();
        $data['phone'] = $user->profile?->phone ?? $user->phone;
        $data['gender'] = $user->profile?->gender;
        $data['birth_year'] = $user->profile?->birth_year;
        $data['address'] = $user->profile?->address;
        $data['social_media'] = $user->profile?->social_media ?? [];
        $data['bio'] = $user->profile?->bio;

        return response()->json($data);
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
