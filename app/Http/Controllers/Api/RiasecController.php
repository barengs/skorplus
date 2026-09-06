<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RiasecQuestion;
use App\Models\RiasecResult;

class RiasecController extends Controller
{
    public function questions()
    {
        $questions = RiasecQuestion::where('is_active', true)->orderBy('sort_order')->get();
        return response()->json($questions);
    }

    public function submit(Request $request)
    {
        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.dimension' => 'required|in:R,I,A,S,E,C',
            'answers.*.score' => 'required|integer|min:0|max:5',
        ]);

        $scores = ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0];

        foreach ($validated['answers'] as $ans) {
            $scores[$ans['dimension']] += $ans['score'];
        }

        // Determine primary and secondary types
        arsort($scores);
        $topTypes = array_keys($scores);
        $primary = $topTypes[0];
        $secondary = $topTypes[1];
        
        $hollandCode = $primary . $secondary;

        // Simple hardcoded recommendation engine mapping Holland Codes to Careers/Majors
        $recommendations = $this->getRecommendations($hollandCode);

        $result = RiasecResult::create([
            'user_id' => auth()->id(),
            'r_score' => $scores['R'],
            'i_score' => $scores['I'],
            'a_score' => $scores['A'],
            's_score' => $scores['S'],
            'e_score' => $scores['E'],
            'c_score' => $scores['C'],
            'primary_type' => $primary,
            'secondary_type' => $secondary,
            'career_recommendations' => $recommendations['careers'],
            'major_recommendations' => $recommendations['majors'],
        ]);

        return response()->json($result);
    }

    public function result()
    {
        $result = RiasecResult::where('user_id', auth()->id())->latest()->first();
        if (!$result) return response()->json(null);
        return response()->json($result);
    }

    private function getRecommendations($hollandCode)
    {
        $map = [
            'RI' => ['majors' => ['Teknik Mesin', 'Kehutanan', 'Teknik Elektro'], 'careers' => ['Insinyur', 'Ahli Geologi', 'Mekanik']],
            'IR' => ['majors' => ['Ilmu Komputer', 'Kimia', 'Fisika'], 'careers' => ['Programmer', 'Peneliti', 'Ilmuwan']],
            'IA' => ['majors' => ['Psikologi', 'Arsitektur', 'Biologi'], 'careers' => ['Psikolog', 'Arsitek', 'Analis Peneliti']],
            'AI' => ['majors' => ['Seni Rupa', 'Desain Komunikasi Visual', 'Jurnalistik'], 'careers' => ['Desainer Grafis', 'Penulis', 'Editor']],
            'AS' => ['majors' => ['Pendidikan Seni', 'Sastra', 'Ilmu Komunikasi'], 'careers' => ['Guru Seni', 'Public Relations', 'Penyiar']],
            'SA' => ['majors' => ['Pendidikan', 'Bimbingan Konseling', 'Keperawatan'], 'careers' => ['Guru', 'Konselor', 'Perawat']],
            'SE' => ['majors' => ['Kesehatan Masyarakat', 'Manajemen Pendidikan', 'Pariwisata'], 'careers' => ['HRD', 'Terapis', 'Manajer Pelatihan']],
            'ES' => ['majors' => ['Manajemen Bisnis', 'Ilmu Hukum', 'Ilmu Politik'], 'careers' => ['Pengacara', 'Pengusaha', 'Manajer Penjualan']],
            'EC' => ['majors' => ['Manajemen Keuangan', 'Administrasi Bisnis', 'Akuntansi'], 'careers' => ['Agen Real Estate', 'Manajer Bank', 'Eksekutif']],
            'CE' => ['majors' => ['Akuntansi', 'Statistika', 'Ilmu Aktuaria'], 'careers' => ['Akuntan', 'Analis Keuangan', 'Auditor']],
            'CR' => ['majors' => ['Sistem Informasi', 'Administrasi Perkantoran', 'Perpajakan'], 'careers' => ['Data Entry', 'Programmer Bisnis', 'Staf Administrasi']],
            'RC' => ['majors' => ['Teknik Sipil', 'Teknologi Pertanian', 'Survei dan Pemetaan'], 'careers' => ['Surveyor', 'Teknisi Kualitas', 'Operator Alat Berat']],
        ];

        // Fallback for codes without specific mapped recommendations
        if (isset($map[$hollandCode])) {
            return $map[$hollandCode];
        }

        // Generic fallback mapping based on primary type only
        $genericMap = [
            'R' => ['majors' => ['Teknik', 'Ilmu Terapan', 'Logistik'], 'careers' => ['Insinyur', 'Teknisi', 'Mekanik']],
            'I' => ['majors' => ['Matematika', 'Sains', 'Teknologi Informasi'], 'careers' => ['Peneliti', 'Programmer', 'Analis Data']],
            'A' => ['majors' => ['Seni Desain', 'Sastra', 'Ilmu Komunikasi'], 'careers' => ['Desainer', 'Penulis', 'Seniman']],
            'S' => ['majors' => ['Pendidikan', 'Psikologi', 'Keperawatan'], 'careers' => ['Guru', 'Konselor', 'Tenaga Medis']],
            'E' => ['majors' => ['Manajemen', 'Bisnis', 'Hukum'], 'careers' => ['Manajer', 'Pengusaha', 'Konsultan Hukum']],
            'C' => ['majors' => ['Akuntansi', 'Administrasi', 'Statistika'], 'careers' => ['Akuntan', 'Staf Administrasi', 'Auditor']],
        ];

        return $genericMap[$hollandCode[0]] ?? ['majors' => ['Umum'], 'careers' => ['Profesional Umum']];
    }
}
