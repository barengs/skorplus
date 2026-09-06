<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Program;

class ProgramController extends Controller
{
    public function index()
    {
        return response()->json(Program::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:programs,slug',
            'icon' => 'nullable|string',
            'price' => 'required|string',
            'price_period' => 'nullable|string',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'color' => 'nullable|string',
            'ring_color' => 'nullable|string',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $program = Program::create($validated);
        return response()->json($program, 201);
    }

    public function show(Program $program)
    {
        return response()->json($program);
    }

    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:programs,slug,' . $program->id,
            'icon' => 'nullable|string',
            'price' => 'sometimes|required|string',
            'price_period' => 'nullable|string',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'color' => 'nullable|string',
            'ring_color' => 'nullable|string',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $program->update($validated);
        return response()->json($program);
    }

    public function destroy(Program $program)
    {
        $program->delete();
        return response()->json(['message' => 'Program deleted successfully']);
    }
}
