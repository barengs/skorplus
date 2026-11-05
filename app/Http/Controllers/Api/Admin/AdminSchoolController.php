<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exports\SchoolStudentsExport;
use App\Exports\SchoolStudentsTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\SchoolStudentsImport;
use App\Models\AuditLog;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminSchoolController extends Controller
{
    public function publicList(): JsonResponse
    {
        $schools = School::where('is_active', true)
            ->with(['activeLearningPackages:id,name,slug'])
            ->select('id', 'name', 'npsn')
            ->orderBy('name')
            ->get();

        return response()->json($schools);
    }

    public function index(Request $request): JsonResponse
    {
        $query = School::withCount(['students', 'admins']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('npsn', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $schools = $query->latest()->get();

        return response()->json($schools);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'npsn' => 'nullable|string|max:30|unique:schools,npsn',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
            'photo' => 'nullable|string',
            'is_active' => 'boolean',
            // Optional initial school admin creation
            'admin_name' => 'nullable|string|max:255',
            'admin_email' => 'nullable|email|max:255|unique:users,email',
            'admin_password' => 'nullable|string|min:6',
            'admin_avatar' => 'nullable|string',
        ]);

        $school = School::create([
            'name' => $validated['name'],
            'npsn' => $validated['npsn'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'logo' => $validated['logo'] ?? null,
            'photo' => $validated['photo'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // If admin credentials provided, create the admin account
        if (! empty($validated['admin_email'])) {
            $adminUser = User::create([
                'name' => $validated['admin_name'] ?: 'Admin '.$school->name,
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password'] ?: 'password123'),
                'school' => $school->name,
                'school_id' => $school->id,
                'avatar' => $validated['admin_avatar'] ?? null,
                'is_active' => true,
            ]);

            $adminRole = Role::firstOrCreate(['name' => 'admin_sekolah', 'guard_name' => 'api']);
            $adminUser->assignRole($adminRole);
            $adminUser->syncRoleProfile([
                'role' => 'admin_sekolah',
                'phone' => $validated['phone'] ?? null,
                'position' => 'Koordinator Sekolah',
            ]);
        }

        $school->loadCount(['students', 'admins']);

        return response()->json($school, 201);
    }

    public function show(School $school): JsonResponse
    {
        $school->loadCount(['students', 'admins']);
        $school->load([
            'admins' => function ($q) {
                $q->select('id', 'name', 'email', 'phone', 'avatar', 'school_id', 'is_active', 'created_at')
                    ->with('schoolAdminProfile');
            },
            'students' => function ($q) {
                $q->select('id', 'name', 'email', 'nisn', 'phone', 'avatar', 'program', 'school_id', 'is_active', 'created_at')
                    ->with(['profile', 'studentProfile'])
                    ->withCount('cbtSessions')
                    ->latest();
            },
        ]);

        $schoolData = $school->toArray();
        $schoolData['students'] = collect($school->students)->map(function (User $student) {
            $resolved = $student->resolvedProfileAttributes();
            $item = $student->toArray();
            $item['phone'] = $resolved['phone'];
            $item['gender'] = $resolved['gender'];
            $item['birth_year'] = $resolved['birth_year'];
            $item['address'] = $resolved['address'];
            $item['class_level_id'] = $resolved['class_level_id'];
            $item['class_level'] = $resolved['class_level'];
            $item['target_campus'] = $resolved['target_campus'];

            return $item;
        })->values()->all();

        return response()->json($schoolData);
    }

    public function update(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'npsn' => ['nullable', 'string', 'max:30', Rule::unique('schools', 'npsn')->ignore($school->id)],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
            'photo' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $school->update($validated);
        $school->loadCount(['students', 'admins']);

        return response()->json($school);
    }

    public function destroy(School $school): JsonResponse
    {
        $school->delete();

        return response()->json(['message' => 'Sekolah berhasil dihapus']);
    }

    public function createAdmin(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:30',
            'avatar' => 'nullable|string',
        ]);

        $adminUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'school' => $school->name,
            'school_id' => $school->id,
            'avatar' => $validated['avatar'] ?? null,
            'is_active' => true,
        ]);

        $adminRole = Role::firstOrCreate(['name' => 'admin_sekolah', 'guard_name' => 'api']);
        $adminUser->assignRole($adminRole);
        $adminUser->syncRoleProfile([
            'role' => 'admin_sekolah',
            'phone' => $validated['phone'] ?? null,
            'position' => 'Koordinator Sekolah',
        ]);

        return response()->json([
            'message' => 'Akun Admin Sekolah berhasil dibuat',
            'user' => $adminUser,
        ], 201);
    }

    public function createStudent(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:6',
            'nisn' => 'nullable|string|max:30|unique:users,nisn',
            'phone' => 'nullable|string|max:30',
            'avatar' => 'nullable|string',
            'program' => 'nullable|string|in:mandiri,intensif,garansi',
            'class_level_id' => 'nullable|integer|exists:class_levels,id',
            'class_level' => 'nullable|string|max:100',
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
            'avatar' => $validated['avatar'] ?? null,
            'school' => $school->name,
            'school_id' => $school->id,
            'program' => $validated['program'] ?? 'intensif',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $siswaRole = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        $student->assignRole($siswaRole);

        $student->syncRoleProfile([
            'role' => 'siswa',
            'phone' => $validated['phone'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_year' => $validated['birth_year'] ?? null,
            'address' => $validated['address'] ?? null,
            'class_level_id' => $validated['class_level_id'] ?? null,
            'class_level' => $validated['class_level'] ?? null,
        ]);

        AuditLog::record('CREATE_STUDENT', "Admin menambahkan siswa baru '{$student->name}' ke sekolah {$school->name}.", 'school', $student);

        $student->load(['profile', 'studentProfile']);
        $resolved = $student->resolvedProfileAttributes();
        $studentData = $student->toArray();
        $studentData['class_level_id'] = $resolved['class_level_id'];
        $studentData['class_level'] = $resolved['class_level'];
        $studentData['gender'] = $resolved['gender'];
        $studentData['birth_year'] = $resolved['birth_year'];
        $studentData['address'] = $resolved['address'];

        return response()->json([
            'message' => 'Siswa berhasil ditambahkan ke sekolah.',
            'student' => $studentData,
        ], 201);
    }

    public function updateStudent(Request $request, School $school, User $student): JsonResponse
    {
        if ($student->school_id !== $school->id) {
            return response()->json(['message' => 'Siswa tidak terdaftar di sekolah ini.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student->id)],
            'password' => 'nullable|string|min:6',
            'nisn' => ['nullable', 'string', 'max:30', Rule::unique('users', 'nisn')->ignore($student->id)],
            'phone' => 'nullable|string|max:30',
            'avatar' => 'nullable|string',
            'program' => 'nullable|string|in:mandiri,intensif,garansi',
            'class_level_id' => 'nullable|integer|exists:class_levels,id',
            'class_level' => 'nullable|string|max:100',
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
            'avatar' => array_key_exists('avatar', $validated) ? $validated['avatar'] : $student->avatar,
            'program' => $validated['program'] ?? $student->program,
            'is_active' => $validated['is_active'] ?? $student->is_active,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $student->update($updateData);

        $profileInput = ['role' => 'siswa'];
        foreach (['phone', 'gender', 'birth_year', 'address', 'class_level_id', 'class_level'] as $field) {
            if (array_key_exists($field, $validated)) {
                $profileInput[$field] = $validated[$field];
            }
        }
        $student->syncRoleProfile($profileInput);

        AuditLog::record('UPDATE_STUDENT', "Admin memperbarui data siswa '{$student->name}' ({$student->email}) pada sekolah {$school->name}.", 'school', $student);

        $fresh = $student->fresh()->load(['profile', 'studentProfile']);
        $resolved = $fresh->resolvedProfileAttributes();
        $studentData = $fresh->toArray();
        $studentData['class_level_id'] = $resolved['class_level_id'];
        $studentData['class_level'] = $resolved['class_level'];
        $studentData['gender'] = $resolved['gender'];
        $studentData['birth_year'] = $resolved['birth_year'];
        $studentData['address'] = $resolved['address'];

        return response()->json([
            'message' => 'Data siswa berhasil diperbarui.',
            'student' => $studentData,
        ]);
    }

    public function deleteStudent(School $school, User $student): JsonResponse
    {
        if ($student->school_id !== $school->id) {
            return response()->json(['message' => 'Siswa tidak terdaftar di sekolah ini.'], 403);
        }

        AuditLog::record('DELETE_STUDENT', "Admin menghapus siswa '{$student->name}' ({$student->email}) dari sekolah {$school->name}.", 'school', $student);

        $student->delete();

        return response()->json(['message' => 'Siswa berhasil dihapus dari sekolah.']);
    }

    /**
     * Export students of a school to Excel file.
     */
    public function exportStudents(School $school): BinaryFileResponse
    {
        $filename = 'data-siswa-'.strtolower(str_replace(' ', '-', $school->name)).'-'.date('Y-m-d').'.xlsx';

        AuditLog::record('EXPORT_STUDENTS', "Admin mengekspor data siswa sekolah {$school->name} ke Excel.", 'school', $school);

        return Excel::download(new SchoolStudentsExport($school), $filename);
    }

    /**
     * Download Excel template for importing students.
     */
    public function downloadStudentTemplate(): BinaryFileResponse
    {
        return Excel::download(new SchoolStudentsTemplateExport, 'template-import-data-siswa.xlsx');
    }

    /**
     * Import students from Excel file.
     */
    public function importStudents(Request $request, School $school): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $import = new SchoolStudentsImport($school);

            Excel::import($import, $request->file('file'));

            if ($import->getErrors()) {
                AuditLog::record('IMPORT_STUDENTS', "Admin mengimpor siswa ke sekolah {$school->name} (berhasil: {$import->getImportedCount()}, gagal: ".count($import->getErrors()).').', 'school', $school, ['errors' => $import->getErrors()]);

                return response()->json([
                    'message' => 'Import selesai dengan beberapa kesalahan',
                    'imported' => $import->getImportedCount(),
                    'errors' => $import->getErrors(),
                ], 207);
            }

            AuditLog::record('IMPORT_STUDENTS', "Admin berhasil mengimpor {$import->getImportedCount()} siswa ke sekolah {$school->name}.", 'school', $school, ['imported_count' => $import->getImportedCount()]);

            return response()->json([
                'message' => "Berhasil mengimpor {$import->getImportedCount()} siswa.",
                'imported' => $import->getImportedCount(),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal mengimpor data: '.$e->getMessage()], 500);
        }
    }
}
