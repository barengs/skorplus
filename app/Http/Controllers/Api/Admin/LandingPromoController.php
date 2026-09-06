<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LandingPromo;

class LandingPromoController extends Controller
{
    public function show()
    {
        $promo = LandingPromo::latest()->first() ?? new LandingPromo();
        return response()->json($promo);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'text' => 'required|string|max:255',
            'countdown_seconds' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $promo = LandingPromo::latest()->first();
        if ($promo) {
            $promo->update($validated);
        } else {
            $promo = LandingPromo::create($validated);
        }

        return response()->json($promo);
    }
}
