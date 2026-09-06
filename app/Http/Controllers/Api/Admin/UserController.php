<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('roles');

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
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
            'is_active' => $validated['is_active'] ?? true,
        ]);
        
        $roleName = $validated['role'] ?? 'siswa';
        $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
        if ($role) {
            $user->assignRole($role);
        }

        $data = $user->toArray();
        $data['roles'] = $user->getRoleNames();

        return response()->json($data, 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'program' => 'nullable|string',
            'phone' => 'nullable|string',
            'is_active' => 'boolean',
            'role' => 'nullable|string|exists:roles,name',
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
            'program' => $validated['program'] ?? $user->program,
            'phone' => $validated['phone'] ?? $user->phone,
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ]);

        if (isset($validated['role'])) {
            $role = Role::where('name', $validated['role'])->where('guard_name', 'api')->first();
            if ($role) {
                $user->syncRoles([$role]);
            }
        }

        $data = $user->fresh()->toArray();
        $data['roles'] = $user->getRoleNames();

        return response()->json($data);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
