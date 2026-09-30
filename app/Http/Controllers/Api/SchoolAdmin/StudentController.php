<?php

namespace App\Http\Controllers\Api\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class StudentController extends Controller
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

    public function index(Request $request): JsonResponse
    {
        $school = $this->getSchool();

        $query = User::role('siswa', 'api')
            ->where('school_id', $school->id)
            ->with(['profile'])
            ->withCount(['cbtSessions']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        if ($request->filled('program')) {
            $query->where('program', $request->program);
        }

        $students = $query->latest()->get()->map(function (User $user) {
            $data = $user->toArray();
            $data['phone'] = $user->profile?->phone ?? $user->phone;
            $data['gender'] = $user->profile?->gender;
            $data['birth_year'] = $user->profile?->birth_year;
            $data['address'] = $user->profile?->address;

            return $data;
        });

        return response()->json([
            'school' => [
                'id' => $school->id,
                'name' => $school->name,
                'npsn' => $school->npsn,
            ],
            'students' => $students,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $this->getSchool();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:6',
            'nisn' => 'nullable|string|max:30|unique:users,nisn',
            'phone' => 'nullable|string|max:30',
            'program' => 'nullable|string|in:mandiri,intensif,garansi',
            'gender' => 'nullable|string|in:laki-laki,perempuan',
            'birth_year' => 'nullable|integer',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $student = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'password123'),
            'nisn' => $validated['nisn'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'school' => $school->name,
            'school_id' => $school->id,
            'program' => $validated['program'] ?? 'intensif',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $student->profile()->create([
            'phone' => $validated['phone'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_year' => $validated['birth_year'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        $siswaRole = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        $student->assignRole($siswaRole);

        return response()->json([
            'message' => 'Siswa berhasil didaftarkan.',
            'student' => $student->load('profile'),
        ], 201);
    }

    public function show(User $student): JsonResponse
    {
        $school = $this->getSchool();

        if ($student->school_id !== $school->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $student->load(['profile', 'cbtSessions' => function ($q) {
            $q->latest()->take(10);
        }]);

        return response()->json($student);
    }

    public function update(Request $request, User $student): JsonResponse
    {
        $school = $this->getSchool();

        if ($student->school_id !== $school->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student->id)],
            'password' => 'nullable|string|min:6',
            'nisn' => ['nullable', 'string', 'max:30', Rule::unique('users', 'nisn')->ignore($student->id)],
            'phone' => 'nullable|string|max:30',
            'program' => 'nullable|string|in:mandiri,intensif,garansi',
            'gender' => 'nullable|string|in:laki-laki,perempuan',
            'birth_year' => 'nullable|integer',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $updateData = [
            'name' => $validated['name'] ?? $student->name,
            'email' => $validated['email'] ?? $student->email,
            'nisn' => $validated['nisn'] ?? $student->nisn,
            'phone' => $validated['phone'] ?? $student->phone,
            'program' => $validated['program'] ?? $student->program,
            'is_active' => $validated['is_active'] ?? $student->is_active,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $student->update($updateData);

        $student->profile()->updateOrCreate(
            ['user_id' => $student->id],
            [
                'phone' => $validated['phone'] ?? $student->profile?->phone,
                'gender' => $validated['gender'] ?? $student->profile?->gender,
                'birth_year' => $validated['birth_year'] ?? $student->profile?->birth_year,
                'address' => $validated['address'] ?? $student->profile?->address,
            ]
        );

        return response()->json([
            'message' => 'Data siswa berhasil diperbarui.',
            'student' => $student->fresh()->load('profile'),
        ]);
    }

    public function destroy(User $student): JsonResponse
    {
        $school = $this->getSchool();

        if ($student->school_id !== $school->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $student->delete();

        return response()->json(['message' => 'Siswa berhasil dihapus.']);
    }

    public function batchStore(Request $request): JsonResponse
    {
        $school = $this->getSchool();

        $request->validate([
            'students' => 'required|array|min:1',
            'students.*.name' => 'required|string|max:255',
            'students.*.email' => 'required|email|max:255',
            'students.*.nisn' => 'nullable|string|max:30',
            'students.*.phone' => 'nullable|string|max:30',
            'students.*.program' => 'nullable|string|in:mandiri,intensif,garansi',
        ]);

        $siswaRole = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        $created = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($request->students as $index => $item) {
                // Check if email already exists
                if (User::where('email', $item['email'])->exists()) {
                    $errors[] = 'Baris #'.($index + 1).": Email {$item['email']} sudah terdaftar.";

                    continue;
                }

                if (! empty($item['nisn']) && User::where('nisn', $item['nisn'])->exists()) {
                    $errors[] = 'Baris #'.($index + 1).": NISN {$item['nisn']} sudah terdaftar.";

                    continue;
                }

                $user = User::create([
                    'name' => $item['name'],
                    'email' => $item['email'],
                    'password' => Hash::make('password123'),
                    'nisn' => $item['nisn'] ?? null,
                    'phone' => $item['phone'] ?? null,
                    'school' => $school->name,
                    'school_id' => $school->id,
                    'program' => $item['program'] ?? 'intensif',
                    'is_active' => true,
                ]);

                $user->profile()->create([
                    'phone' => $item['phone'] ?? null,
                ]);

                $user->assignRole($siswaRole);
                $created++;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['message' => 'Terjadi kesalahan saat menyimpan data: '.$e->getMessage()], 500);
        }

        return response()->json([
            'message' => "Berhasil mengimpor {$created} siswa.",
            'created_count' => $created,
            'errors' => $errors,
        ]);
    }
}
