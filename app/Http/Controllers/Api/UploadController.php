<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function uploadThumbnail(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:webp,jpeg,png,jpg|max:5120', // 5MB max
        ]);

        $file = $validated['file'];
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('thumbnails/' . date('Y/m'), $filename, 'public');

        return response()->json([
            'success' => true,
            'url' => asset('storage/' . $path),
            'filename' => $filename,
        ], 201);
    }
}
