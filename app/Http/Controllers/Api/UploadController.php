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
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs('thumbnails/'.date('Y/m'), $filename, 'public');

        return response()->json([
            'success' => true,
            'url' => asset('storage/'.$path),
            'filename' => $filename,
        ], 201);
    }

    public function uploadDocument(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:pdf,docx,doc|max:20480', // 20MB max
        ]);

        $file = $validated['file'];
        $originalName = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension();
        $filename = Str::uuid().'.'.$ext;
        $path = $file->storeAs('documents/'.date('Y/m'), $filename, 'public');

        return response()->json([
            'success' => true,
            'url' => asset('storage/'.$path),
            'filename' => $filename,
            'original_name' => $originalName,
            'extension' => strtolower($ext),
        ], 201);
    }

    public function uploadAvatar(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:webp,jpeg,png,jpg|max:5120', // 5MB max
        ]);

        $file = $validated['file'];
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs('avatars/'.date('Y/m'), $filename, 'public');

        return response()->json([
            'success' => true,
            'url' => asset('storage/'.$path),
            'filename' => $filename,
        ], 201);
    }
}
