<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class UploadWebpTest extends TestCase
{
    use RefreshDatabase;

    public function test_thumbnail_upload_converts_to_webp(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $file = UploadedFile::fake()->image('banner.png', 400, 300);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/upload/thumbnail', [
                'file' => $file,
            ]);

        $response->assertCreated()
            ->assertJsonStructure(['url', 'filename']);

        $url = $response->json('url');
        $this->assertStringEndsWith('.webp', $url);

        $path = ltrim(str_replace('/storage/', '', parse_url($url, PHP_URL_PATH)), '/');
        Storage::disk('public')->assertExists($path);
    }

    public function test_avatar_upload_converts_to_webp(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $token = JWTAuth::fromUser($user);

        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/upload/avatar', [
                'file' => $file,
            ]);

        $response->assertCreated()
            ->assertJsonStructure(['url', 'filename']);

        $url = $response->json('url');
        $this->assertStringEndsWith('.webp', $url);

        $path = ltrim(str_replace('/storage/', '', parse_url($url, PHP_URL_PATH)), '/');
        Storage::disk('public')->assertExists($path);
    }

    public function test_document_upload_keeps_original_extension(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $file = UploadedFile::fake()->create('modul.pdf', 100, 'application/pdf');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/upload/document', [
                'file' => $file,
            ]);

        $response->assertCreated()
            ->assertJsonStructure(['url', 'filename', 'original_name']);

        $url = $response->json('url');
        $this->assertStringEndsWith('.pdf', $url);
    }
}
