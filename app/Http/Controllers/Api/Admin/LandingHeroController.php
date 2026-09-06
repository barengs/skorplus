<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LandingHero;

class LandingHeroController extends Controller
{
    public function show()
    {
        $hero = LandingHero::latest()->first() ?? new LandingHero();
        return response()->json($hero);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'badge_text' => 'nullable|string',
            'cta_primary_text' => 'nullable|string',
            'cta_primary_link' => 'nullable|string',
            'cta_secondary_text' => 'nullable|string',
            'cta_secondary_link' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $hero = LandingHero::latest()->first();
        if ($hero) {
            $hero->update($validated);
        } else {
            $hero = LandingHero::create($validated);
        }

        return response()->json($hero);
    }
}
