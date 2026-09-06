<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Stat;

class StatController extends Controller
{
    public function index()
    {
        return response()->json(Stat::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'value' => 'required|string|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $stat = Stat::create($validated);
        return response()->json($stat, 201);
    }

    public function show(Stat $stat)
    {
        return response()->json($stat);
    }

    public function update(Request $request, Stat $stat)
    {
        $validated = $request->validate([
            'label' => 'sometimes|required|string|max:255',
            'value' => 'sometimes|required|string|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $stat->update($validated);
        return response()->json($stat);
    }

    public function destroy(Stat $stat)
    {
        $stat->delete();
        return response()->json(['message' => 'Stat deleted successfully']);
    }
}
