<?php

namespace App\Exports;

use App\Models\School;
use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SchoolStudentsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    protected int $rowNumber = 0;

    public function __construct(
        protected School $school
    ) {}

    public function collection(): Collection
    {
        return User::role('siswa', 'api')
            ->where('school_id', $this->school->id)
            ->with(['profile', 'cbtSessions'])
            ->withCount('cbtSessions')
            ->orderBy('name')
            ->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama Lengkap',
            'Email',
            'NISN',
            'No. WhatsApp / HP',
            'Program',
            'Jenis Kelamin',
            'Tahun Lahir',
            'Alamat',
            'Aktivitas CBT (Sesi)',
            'Status',
            'Tanggal Terdaftar',
        ];
    }

    /**
     * @param  User  $student
     */
    public function map($student): array
    {
        $this->rowNumber++;

        return [
            $this->rowNumber,
            $student->name,
            $student->email,
            $student->nisn ? (string) $student->nisn : '-',
            $student->phone ?: ($student->profile?->phone ?: '-'),
            ucfirst($student->program ?: 'intensif'),
            $student->profile?->gender ? ucfirst($student->profile->gender) : '-',
            $student->profile?->birth_year ?: '-',
            $student->profile?->address ?: '-',
            $student->cbt_sessions_count ?? $student->cbtSessions->count(),
            $student->is_active ? 'Aktif' : 'Nonaktif',
            $student->created_at ? $student->created_at->format('d/m/Y H:i') : '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '2563EB'], // Blue 600
                ],
            ],
        ];
    }
}
