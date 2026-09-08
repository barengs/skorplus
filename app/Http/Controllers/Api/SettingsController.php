<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function getPublicSettings()
    {
        $settings = Setting::pluck('value', 'key')->toArray();

        // Defaults
        $defaults = [
            'app_name' => 'SkorPluss',
            'tagline' => 'Platform Pembelajaran & Ujian Online Terdepan',
            'logo_url' => '',
            'default_language' => 'id',
        ];

        return response()->json(array_merge($defaults, $settings));
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'logo_url' => 'nullable|string',
            'default_language' => 'nullable|string|in:id,en',
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json([
            'message' => 'Pengaturan berhasil diperbarui',
            'settings' => $this->getPublicSettings()->original
        ]);
    }
}
