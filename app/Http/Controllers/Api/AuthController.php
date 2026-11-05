<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\School;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
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
            'school_id' => 'required|exists:schools,id',
            'nisn' => 'nullable|string|max:20|unique:users',
            'class_level_id' => 'nullable|integer|exists:class_levels,id',
            'class_level' => 'nullable|string|max:100',
            'program' => 'nullable|in:mandiri,intensif,garansi',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $school = School::find($request->school_id);

        // Dynamic Trial Logic
        $trialEnabled = Setting::where('key', 'trial_enabled')->value('value') ?? 'true';
        $trialDays = (int) (Setting::where('key', 'trial_days')->value('value') ?? 7);

        $trialEndsAt = null;
        if ($trialEnabled === 'true' && $trialDays > 0) {
            $trialEndsAt = now()->addDays($trialDays);
        }

        // Determine program based on school's active learning package
        $activePackage = $school->activeLearningPackages()->first();
        $program = $request->program ?? 'mandiri';
        if ($activePackage) {
            $program = $activePackage->name;
        }

        $user = DB::transaction(function () use ($request, $school, $program, $trialEndsAt) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'school_id' => $school->id,
                'school' => $school->name,
                'nisn' => $request->nisn,
                'program' => $program,
                'trial_ends_at' => $trialEndsAt,
            ]);

            $siswaRole = Role::where('name', 'siswa')->first()
                ?? Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
            $user->assignRole($siswaRole);

            $user->syncRoleProfile([
                'role' => 'siswa',
                'phone' => $request->phone,
                'class_level_id' => $request->class_level_id,
                'class_level' => $request->class_level,
            ]);

            AuditLog::record('REGISTER', "Pendaftaran akun siswa baru: {$user->name} ({$user->email})", 'auth', $user, null, $user);

            return $user;
        });

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
            'class_level_id' => 'nullable|integer|exists:class_levels,id',
            'class_level' => 'nullable|string|max:100',
            'target_campus' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'alma_mater' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'nip' => 'nullable|string|max:50',
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
        if ($request->has('alma_mater') && $user->hasRole('tutor') && ! $request->has('school')) {
            $user->school = $request->alma_mater;
        }
        if ($request->has('nisn')) {
            $user->nisn = $request->nisn;
        }
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        $user->save();

        // Update or create role-specific profile record (student_profiles, tutor_profiles, school_admin_profiles, admin_profiles)
        $profileInputs = $request->only([
            'phone',
            'gender',
            'birth_year',
            'address',
            'bio',
            'social_media',
            'class_level_id',
            'class_level',
            'target_campus',
            'specialization',
            'alma_mater',
            'position',
            'department',
            'nip',
        ]);

        $user->syncRoleProfile($profileInputs);

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
        $user->loadMissing(['schoolEntity', 'profile', 'studentProfile', 'tutorProfile', 'schoolAdminProfile', 'adminProfile']);
        $resolved = $user->resolvedProfileAttributes();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'nisn' => $user->nisn,
            'school' => $user->schoolEntity?->name ?? $user->school,
            'school_id' => $user->school_id,
            'phone' => $resolved['phone'],
            'program' => $user->program,
            'avatar' => $user->avatar,
            'profile_type' => $resolved['profile_type'],
            'class_level_id' => $resolved['class_level_id'],
            'class_level' => $resolved['class_level'],
            'target_campus' => $resolved['target_campus'],
            'specialization' => $resolved['specialization'],
            'alma_mater' => $resolved['alma_mater'],
            'position' => $resolved['position'],
            'department' => $resolved['department'],
            'nip' => $resolved['nip'],
            'gender' => $resolved['gender'],
            'birth_year' => $resolved['birth_year'],
            'address' => $resolved['address'],
            'social_media' => $resolved['social_media'],
            'bio' => $resolved['bio'],
            'roles' => $user->getRoleNames(),
            'trial' => [
                'is_on_trial' => $user->isOnTrial(),
                'trial_ends_at' => $user->trial_ends_at?->toIso8601String(),
                'days_remaining' => $user->trialDaysRemaining(),
                'is_expired' => $user->trial_ends_at && $user->trial_ends_at->isPast(),
            ],
        ];
    }
}
