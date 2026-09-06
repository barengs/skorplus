<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'phone'    => 'nullable|string|max:20',
            'school'   => 'nullable|string|max:255',
            'nisn'     => 'nullable|string|max:20|unique:users',
            'program'  => 'nullable|in:mandiri,intensif,garansi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'phone'    => $request->phone,
            'school'   => $request->school,
            'nisn'     => $request->nisn,
            'program'  => $request->program ?? 'mandiri',
        ]);

        $user->assignRole('siswa');

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'user'  => $this->userPayload($user),
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

        return response()->json([
            'user'  => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    public function me(): JsonResponse
    {
        return response()->json(['user' => $this->userPayload(auth('api')->user())]);
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
        return [
            'id'      => $user->id,
            'name'    => $user->name,
            'email'   => $user->email,
            'nisn'    => $user->nisn,
            'school'  => $user->school,
            'phone'   => $user->phone,
            'program' => $user->program,
            'avatar'  => $user->avatar,
            'roles'   => $user->getRoleNames(),
        ];
    }
}
