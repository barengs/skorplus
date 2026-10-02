<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function uploadThumbnail(Request $request)
    {
        $file = $request->file('file') ?? $request->file('thumbnail') ?? $request->file('image');

        if (! $file) {
            return response()->json([
                'message' => 'The file field is required.',
                'errors' => ['file' => ['The file field is required.']],
            ], 422);
        }

        $validator = Validator::make(['file' => $file], [
            'file' => 'required|file|mimes:webp,jpeg,png,jpg,gif|max:20480', // 20MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $this->storeAsWebp($file, 'thumbnails');

        return response()->json([
            'success' => true,
            'url' => asset('storage/'.$path),
            'filename' => basename($path),
        ], 201);
    }

    public function uploadDocument(Request $request)
    {
        $file = $request->file('file') ?? $request->file('document');

        if (! $file) {
            return response()->json([
                'message' => 'The file field is required.',
                'errors' => ['file' => ['The file field is required.']],
            ], 422);
        }

        $validator = Validator::make(['file' => $file], [
            'file' => 'required|file|mimes:pdf,docx,doc|max:30720', // 30MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

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
        $file = $request->file('file') ?? $request->file('avatar') ?? $request->file('image');

        if (! $file) {
            return response()->json([
                'message' => 'The file field is required.',
                'errors' => ['file' => ['The file field is required.']],
            ], 422);
        }

        $validator = Validator::make(['file' => $file], [
            'file' => 'required|file|mimes:webp,jpeg,png,jpg,gif|max:20480', // 20MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $this->storeAsWebp($file, 'avatars');

        return response()->json([
            'success' => true,
            'url' => asset('storage/'.$path),
            'filename' => basename($path),
        ], 201);
    }

    /**
     * Convert an uploaded image to WebP format and save to public storage.
     */
    protected function storeAsWebp($file, string $folder): string
    {
        $uuid = (string) Str::uuid();
        $subFolder = $folder.'/'.date('Y/m');
        $extension = strtolower($file->getClientOriginalExtension());

        // If WebP or GD is not loaded, fallback to direct upload
        if (! function_exists('imagewebp') || ! extension_loaded('gd')) {
            $filename = $uuid.'.'.$extension;

            return $file->storeAs($subFolder, $filename, 'public');
        }

        $sourcePath = $file->getRealPath();
        $image = null;

        if ($extension === 'jpeg' || $extension === 'jpg') {
            $image = @imagecreatefromjpeg($sourcePath);
        } elseif ($extension === 'png') {
            $image = @imagecreatefrompng($sourcePath);
            if ($image) {
                imagepalettetotruecolor($image);
                imagealphablending($image, true);
                imagesavealpha($image, true);
            }
        } elseif ($extension === 'webp') {
            // Already webp, just store it
            $filename = $uuid.'.webp';

            return $file->storeAs($subFolder, $filename, 'public');
        } elseif ($extension === 'gif') {
            $image = @imagecreatefromgif($sourcePath);
        }

        if (! $image) {
            // Fallback if unable to read image via GD
            $filename = $uuid.'.'.$extension;

            return $file->storeAs($subFolder, $filename, 'public');
        }

        // Save as WebP into a temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'webp_');
        $converted = @imagewebp($image, $tempFile, 85);
        imagedestroy($image);

        if ($converted && file_exists($tempFile)) {
            $filename = $uuid.'.webp';
            $relativePath = $subFolder.'/'.$filename;
            Storage::disk('public')->put($relativePath, file_get_contents($tempFile));
            @unlink($tempFile);

            return $relativePath;
        }

        // Fallback if conversion failed
        $filename = $uuid.'.'.$extension;

        return $file->storeAs($subFolder, $filename, 'public');
    }
}
