<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SchoolStudentsTemplateExport implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles
{
    public function collection(): Collection
    {
        return collect([
            [
                'nama_lengkap' => 'Ahmad Fauzi Pratama',
                'email' => 'ahmad.fauzi@contoh.sch.id',
                'password' => 'password123',
                'nisn' => '0081234561',
                'no_whatsapp' => '081234567890',
                'program' => 'intensif',
                'jenis_kelamin' => 'laki-laki',
                'tahun_lahir' => 2007,
                'alamat' => 'Jl. Sudirman No. 12, Jakarta',
            ],
            [
                'nama_lengkap' => 'Siti Nurhaliza Putri',
                'email' => 'siti.nurhaliza@contoh.sch.id',
                'password' => 'password123',
                'nisn' => '0081234562',
                'no_whatsapp' => '081234567891',
                'program' => 'mandiri',
                'jenis_kelamin' => 'perempuan',
                'tahun_lahir' => 2007,
                'alamat' => 'Jl. Melati No. 5, Jakarta',
            ],
            [
                'nama_lengkap' => 'Budi Santoso',
                'email' => 'budi.santoso@contoh.sch.id',
                'password' => 'password123',
                'nisn' => '0081234563',
                'no_whatsapp' => '081234567892',
                'program' => 'garansi',
                'jenis_kelamin' => 'laki-laki',
                'tahun_lahir' => 2006,
                'alamat' => 'Jl. Mawar No. 8, Jakarta',
            ],
        ]);
    }

    public function headings(): array
    {
        return [
            'nama_lengkap',
            'email',
            'password',
            'nisn',
            'no_whatsapp',
            'program',
            'jenis_kelamin',
            'tahun_lahir',
            'alamat',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '059669'], // Emerald 600
                ],
            ],
        ];
    }
}
