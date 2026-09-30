<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'school' => 'nullable|string|max:255',
            'nisn' => 'nullable|string|max:20|unique:users',
            'program' => 'nullable|in:mandiri,intensif,garansi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'school' => $request->school,
            'nisn' => $request->nisn,
            'program' => $request->program ?? 'mandiri',
        ]);

        $user->assignRole('siswa');

        AuditLog::record('REGISTER', "Pendaftaran akun siswa baru: {$user->name} ({$user->email})", 'auth', $user, null, $user);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json(['message' => 'Email atau password salah.'], 401);
        }

        $user = auth('api')->user();

        AuditLog::record('LOGIN', "Pengguna {$user->name} berhasil login ke sistem.", 'auth', $user, null, $user);

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    public function me(): JsonResponse
    {
        return response()->json(['user' => $this->userPayload(auth('api')->user())]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'avatar' => 'nullable|string',
            'school' => 'nullable|string|max:255',
            'nisn' => 'nullable|string|max:20|unique:users,nisn,'.$user->id,
            'phone' => 'nullable|string|max:30',
            'gender' => 'nullable|string|in:laki-laki,perempuan',
            'birth_year' => 'nullable|integer|min:1940|max:'.date('Y'),
            'address' => 'nullable|string|max:1000',
            'bio' => 'nullable|string|max:1000',
            'social_media' => 'nullable|array',
            'social_media.*' => 'nullable|string|max:255',
            'current_password' => 'nullable|string',
            'new_password' => 'nullable|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Handle password change if requested
        if ($request->filled('new_password')) {
            if (! $request->filled('current_password') || ! Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'errors' => [
                        'current_password' => ['Password saat ini tidak sesuai.'],
                    ],
                ], 422);
            }

            $user->password = Hash::make($request->new_password);
        }

        // Update core user attributes
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('avatar')) {
            $user->avatar = $request->avatar;
        }
        if ($request->has('school')) {
            $user->school = $request->school;
        }
        if ($request->has('nisn')) {
            $user->nisn = $request->nisn;
        }
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        $user->save();

        // Update or create profile record
        $user->loadMissing('profile');
        $profileData = [
            'phone' => $request->has('phone') ? $request->phone : ($user->profile?->phone ?? $user->phone),
            'gender' => $request->has('gender') ? $request->gender : $user->profile?->gender,
            'birth_year' => $request->has('birth_year') ? $request->birth_year : $user->profile?->birth_year,
            'address' => $request->has('address') ? $request->address : $user->profile?->address,
            'bio' => $request->has('bio') ? $request->bio : $user->profile?->bio,
        ];

        if ($request->has('social_media')) {
            $profileData['social_media'] = $request->social_media;
        }

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $this->userPayload($user->fresh()),
        ]);
    }

    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();

        return response()->json(['token' => $token]);
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    private function userPayload(User $user): array
    {
        $user->loadMissing('profile');
        $profile = $user->profile;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'nisn' => $user->nisn,
            'school' => $user->school,
            'school_id' => $user->school_id,
            'phone' => $profile?->phone ?? $user->phone,
            'program' => $user->program,
            'avatar' => $user->avatar,
            'gender' => $profile?->gender,
            'birth_year' => $profile?->birth_year,
            'address' => $profile?->address,
            'social_media' => $profile?->social_media ?? (object) [],
            'bio' => $profile?->bio,
            'roles' => $user->getRoleNames(),
        ];
    }
}
