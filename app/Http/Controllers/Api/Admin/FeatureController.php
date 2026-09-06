<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Feature;

class FeatureController extends Controller
{
    public function index()
    {
        return response()->json(Feature::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'icon' => 'nullable|string',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $feature = Feature::create($validated);
        return response()->json($feature, 201);
    }

    public function show(Feature $feature)
    {
        return response()->json($feature);
    }

    public function update(Request $request, Feature $feature)
    {
        $validated = $request->validate([
            'icon' => 'nullable|string',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $feature->update($validated);
        return response()->json($feature);
    }

    public function destroy(Feature $feature)
    {
        $feature->delete();
        return response()->json(['message' => 'Feature deleted successfully']);
    }
}
