<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Testimonial;

class TestimonialController extends Controller
{
    public function index()
    {
        return response()->json(Testimonial::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'school' => 'nullable|string|max:255',
            'university' => 'nullable|string|max:255',
            'score' => 'nullable|integer',
            'avatar_text' => 'nullable|string|max:10',
            'avatar_color' => 'nullable|string',
            'content' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $testimonial = Testimonial::create($validated);
        return response()->json($testimonial, 201);
    }

    public function show(Testimonial $testimonial)
    {
        return response()->json($testimonial);
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'school' => 'nullable|string|max:255',
            'university' => 'nullable|string|max:255',
            'score' => 'nullable|integer',
            'avatar_text' => 'nullable|string|max:10',
            'avatar_color' => 'nullable|string',
            'content' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $testimonial->update($validated);
        return response()->json($testimonial);
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();
        return response()->json(['message' => 'Testimonial deleted successfully']);
    }
}
