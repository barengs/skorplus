<?php

namespace App\Http\Controllers\Api\SchoolAdmin;

use App\Exports\SchoolStudentsExport;
use App\Exports\SchoolStudentsTemplateExport;
use App\Http\Controllers\Api\Admin\AdminReportDashboardController;
use App\Http\Controllers\Api\Admin\AdminStudentReportController;
use App\Http\Controllers\Controller;
use App\Imports\SchoolStudentsImport;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
            ->with(['profile', 'studentProfile'])
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

        if ($request->filled('class_level')) {
            $classLevel = $request->class_level;
            $query->where(function ($q) use ($classLevel) {
                $q->whereHas('studentProfile', function ($sq) use ($classLevel) {
                    $sq->where('class_level', $classLevel)
                        ->orWhere('class_level_id', $classLevel);
                })->orWhereHas('profile', function ($pq) use ($classLevel) {
                    $pq->where('class_level', $classLevel)
                        ->orWhere('class_level_id', $classLevel);
                });
            });
        }

        $rawStudents = $query->latest()->get();
        $formattedWithIntervention = app(AdminReportDashboardController::class)
            ->formatStudentsWithIntervention($rawStudents)
            ->keyBy('id');

        $students = $rawStudents->map(function (User $user) use ($formattedWithIntervention) {
            $base = $this->formatStudentPayload($user);
            $extra = $formattedWithIntervention->get($user->id);
            if ($extra) {
                $base['irt'] = $extra['irt'];
                $base['bkt'] = $extra['bkt'];
                $base['follow_up'] = $extra['follow_up'];
                $base['last_cbt_score'] = $extra['last_cbt_score'];
                $base['last_cbt_title'] = $extra['last_cbt_title'];
                $base['last_activity'] = $extra['last_activity'];
                $base['last_activity_at'] = $extra['last_activity_at'];
            }

            return $base;
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

    private function formatStudentPayload(User $user): array
    {
        $user->loadMissing(['profile', 'studentProfile']);
        $resolved = $user->resolvedProfileAttributes();
        $data = $user->toArray();
        $data['phone'] = $resolved['phone'];
        $data['gender'] = $resolved['gender'];
        $data['birth_year'] = $resolved['birth_year'];
        $data['address'] = $resolved['address'];
        $data['class_level_id'] = $resolved['class_level_id'];
        $data['class_level'] = $resolved['class_level'];
        $data['target_campus'] = $resolved['target_campus'];

        return $data;
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

        return response()->json([
            'message' => 'Siswa berhasil didaftarkan.',
            'student' => $this->formatStudentPayload($student->fresh()),
        ], 201);
    }

    public function show(User $student): JsonResponse
    {
        $school = $this->getSchool();

        if ($student->school_id !== $school->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $student->load(['profile', 'studentProfile', 'cbtSessions' => function ($q) {
            $q->latest()->take(10);
        }]);

        return response()->json($this->formatStudentPayload($student));
    }

    /**
     * Rapor analitik siswa (BKT & IRT) untuk Admin Sekolah
     */
    public function report(Request $request, User $student): JsonResponse
    {
        $school = $this->getSchool();

        if ($student->school_id !== $school->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        return app(AdminStudentReportController::class)->show($request, $student);
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

        return response()->json([
            'message' => 'Data siswa berhasil diperbarui.',
            'student' => $this->formatStudentPayload($student->fresh()),
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
            'students.*.class_level' => 'nullable|string|max:100',
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

                $user->assignRole($siswaRole);
                $user->syncRoleProfile([
                    'role' => 'siswa',
                    'phone' => $item['phone'] ?? null,
                    'class_level' => $item['class_level'] ?? null,
                ]);
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

    /**
     * Export students of school to Excel file.
     */
    public function export(): BinaryFileResponse
    {
        $school = $this->getSchool();
        $filename = 'data-siswa-'.strtolower(str_replace(' ', '-', $school->name)).'-'.date('Y-m-d').'.xlsx';

        return Excel::download(new SchoolStudentsExport($school), $filename);
    }

    /**
     * Download Excel template for importing students.
     */
    public function downloadTemplate(): BinaryFileResponse
    {
        return Excel::download(new SchoolStudentsTemplateExport, 'template-import-data-siswa.xlsx');
    }

    /**
     * Import students from Excel file.
     */
    public function import(Request $request): JsonResponse
    {
        $school = $this->getSchool();

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
                return response()->json([
                    'message' => 'Import selesai dengan beberapa kesalahan',
                    'imported' => $import->getImportedCount(),
                    'errors' => $import->getErrors(),
                ], 207);
            }

            return response()->json([
                'message' => "Berhasil mengimpor {$import->getImportedCount()} siswa.",
                'imported' => $import->getImportedCount(),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal mengimpor data: '.$e->getMessage()], 500);
        }
    }

    /**
     * Dapatkan analisis individual siswa sekolah (IRT & BKT) beserta rencana tindak lanjut
     */
    public function studentsAnalytics(Request $request): JsonResponse
    {
        $school = $this->getSchool();
        $request->merge(['school_id' => $school->id]);

        return app(AdminReportDashboardController::class)->studentsAnalytics($request);
    }
}
