<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Illuminate\Validation\Rule;

class AdminRoleController extends Controller
{
    public function index()
    {
        return response()->json(Role::where('guard_name', 'api')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('roles')->where(function ($query) {
                    return $query->where('guard_name', 'api');
                })
            ]
        ]);

        $role = Role::create([
            'name' => strtolower($validated['name']),
            'guard_name' => 'api'
        ]);

        return response()->json($role, 201);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        // Don't allow changing core roles names (optional, but good for safety)
        if (in_array($role->name, ['admin', 'siswa', 'tutor']) && $role->name !== strtolower($request->name)) {
            return response()->json(['message' => 'Role inti tidak dapat diubah namanya.'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('roles')->where(function ($query) {
                    return $query->where('guard_name', 'api');
                })->ignore($role->id)
            ]
        ]);

        $role->update(['name' => strtolower($validated['name'])]);

        return response()->json($role);
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        if (in_array($role->name, ['admin', 'siswa', 'tutor'])) {
            return response()->json(['message' => 'Role inti tidak dapat dihapus.'], 403);
        }

        $role->delete();
        return response()->json(null, 204);
    }
}
