<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Menu;
use Spatie\Permission\Models\Role;

class RoleMenuController extends Controller
{
    // Return Matrix (Menus vs Roles)
    public function index()
    {
        $menus = Menu::orderBy('section')->orderBy('sort_order')->get();
        $roles = Role::where('guard_name', 'api')->get();
        
        $matrix = [];
        foreach ($menus as $menu) {
            $menuRoles = $menu->roles->pluck('id')->toArray();
            $matrix[] = [
                'id' => $menu->id,
                'label' => $menu->label,
                'section' => $menu->section,
                'icon' => $menu->icon,
                'roles' => $menuRoles,
            ];
        }

        return response()->json([
            'menus' => $matrix,
            'roles' => $roles
        ]);
    }

    // Toggle Role-Menu Assignment
    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'menu_id' => 'required|exists:menus,id',
            'role_id' => 'required|exists:roles,id',
            'has_access' => 'required|boolean'
        ]);

        $menu = Menu::findOrFail($validated['menu_id']);
        
        if ($validated['has_access']) {
            $menu->roles()->syncWithoutDetaching([$validated['role_id']]);
        } else {
            $menu->roles()->detach($validated['role_id']);
        }

        return response()->json(['message' => 'Matrix updated successfully']);
    }

    // Get My Menus (For Sidebar)
    public function myMenus(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json([]);

        // Get all role IDs of the user
        $roleIds = $user->roles->pluck('id')->toArray();

        // Get menus attached to any of those roles
        $menus = Menu::whereHas('roles', function($q) use ($roleIds) {
            $q->whereIn('roles.id', $roleIds);
        })
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->get();

        return response()->json($menus);
    }
}
