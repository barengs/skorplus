<?php

namespace App\Imports;

use App\Models\School;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Spatie\Permission\Models\Role;

class SchoolStudentsImport implements ToCollection, WithHeadingRow
{
    protected int $importedCount = 0;

    protected array $errors = [];

    protected array $importedStudents = [];

    public function __construct(
        protected School $school
    ) {}

    public function collection(Collection $rows): void
    {
        $siswaRole = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        $existingEmails = [];
        $existingNisns = [];

        foreach ($rows as $index => $row) {
            $lineNumber = $index + 2; // +2: 1-based index and heading row is row 1

            $name = trim($row['nama_lengkap'] ?? $row['nama'] ?? '');
            $email = strtolower(trim($row['email'] ?? ''));

            // Skip completely empty rows
            if (empty($name) && empty($email)) {
                continue;
            }

            if (empty($name)) {
                $this->errors[] = "Baris {$lineNumber}: Nama lengkap siswa wajib diisi.";

                continue;
            }

            if (empty($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->errors[] = "Baris {$lineNumber}: Format email '{$email}' tidak valid.";

                continue;
            }

            // Check duplicate in file
            if (in_array($email, $existingEmails, true)) {
                $this->errors[] = "Baris {$lineNumber}: Email '{$email}' duplikat di dalam file.";

                continue;
            }

            // Check duplicate in database
            if (User::where('email', $email)->exists()) {
                $this->errors[] = "Baris {$lineNumber}: Email '{$email}' sudah terdaftar di sistem.";

                continue;
            }

            $rawNisn = $row['nisn'] ?? null;
            $nisn = ! empty($rawNisn) ? trim((string) $rawNisn) : null;

            if ($nisn) {
                if (in_array($nisn, $existingNisns, true)) {
                    $this->errors[] = "Baris {$lineNumber}: NISN '{$nisn}' duplikat di dalam file.";

                    continue;
                }

                if (User::where('nisn', $nisn)->exists()) {
                    $this->errors[] = "Baris {$lineNumber}: NISN '{$nisn}' sudah terdaftar pada siswa lain.";

                    continue;
                }
            }

            $existingEmails[] = $email;
            if ($nisn) {
                $existingNisns[] = $nisn;
            }

            // Password
            $rawPassword = $row['password'] ?? null;
            $password = ! empty($rawPassword) ? trim((string) $rawPassword) : 'password123';

            // Phone
            $rawPhone = $row['no_whatsapp'] ?? $row['telepon'] ?? $row['phone'] ?? $row['no_hp'] ?? null;
            $phone = ! empty($rawPhone) ? trim((string) $rawPhone) : null;

            // Program
            $rawProgram = strtolower(trim($row['program'] ?? 'intensif'));
            $program = in_array($rawProgram, ['mandiri', 'intensif', 'garansi'], true) ? $rawProgram : 'intensif';

            // Gender
            $rawGender = strtolower(trim($row['jenis_kelamin'] ?? ''));
            $gender = null;
            if (in_array($rawGender, ['l', 'laki-laki', 'pria', 'laki'], true)) {
                $gender = 'laki-laki';
            } elseif (in_array($rawGender, ['p', 'perempuan', 'wanita'], true)) {
                $gender = 'perempuan';
            }

            // Birth Year
            $rawBirthYear = $row['tahun_lahir'] ?? null;
            $birthYear = is_numeric($rawBirthYear) ? (int) $rawBirthYear : null;

            // Address
            $address = ! empty($row['alamat']) ? trim((string) $row['alamat']) : null;

            DB::beginTransaction();
            try {
                $student = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'nisn' => $nisn,
                    'phone' => $phone,
                    'school' => $this->school->name,
                    'school_id' => $this->school->id,
                    'program' => $program,
                    'is_active' => true,
                ]);

                $student->profile()->create([
                    'phone' => $phone,
                    'gender' => $gender,
                    'birth_year' => $birthYear,
                    'address' => $address,
                ]);

                $student->assignRole($siswaRole);

                DB::commit();

                $this->importedCount++;
                $this->importedStudents[] = $student;
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->errors[] = "Baris {$lineNumber}: Gagal menyimpan siswa ({$e->getMessage()})";
            }
        }
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getImportedStudents(): array
    {
        return $this->importedStudents;
    }
}
