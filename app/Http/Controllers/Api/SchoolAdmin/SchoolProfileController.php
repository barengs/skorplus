<?php

namespace App\Http\Controllers\Api\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolProfileController extends Controller
{
    private function getSchool(): School
    {
        $user = auth('api')->user();
        if (! $user->school_id) {
            abort(403, 'Akun Anda tidak terikat dengan sekolah mana pun.');
        }

        $school = School::find($user->school_id);
        if (! $school) {
            abort(404, 'Data sekolah tidak ditemukan.');
        }

        return $school;
    }

    public function show(): JsonResponse
    {
        $school = $this->getSchool();
        $school->loadCount(['students', 'admins']);

        return response()->json([
            'school' => $school,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $school = $this->getSchool();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
        ]);

        $school->update($validated);
        $school->loadCount(['students', 'admins']);

        return response()->json([
            'message' => 'Profil sekolah berhasil diperbarui.',
            'school' => $school,
        ]);
    }
}
