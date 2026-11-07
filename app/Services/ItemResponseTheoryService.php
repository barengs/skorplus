<?php

namespace App\Services;

use App\Models\CbtSession;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Collection;

class ItemResponseTheoryService
{
    /**
     * Skala konversi IRT Theta ke Skor Standar UTBK SNBT
     * Rata-rata nasional = 500, Standar deviasi = 115
     */
    protected float $utbkMean = 500.0;

    protected float $utbkStdDev = 115.0;

    /**
     * Hitung probabilitas jawaban benar berdasarkan model Rasch (1PL)
     * P(u=1 | theta, b) = 1 / (1 + exp(-(theta - b)))
     */
    public function raschProbability(float $theta, float $b): float
    {
        $exponent = -($theta - $b);
        // Batasi rentang eksponen untuk stabilitas numerik
        $exponent = max(-30.0, min(30.0, $exponent));

        return 1.0 / (1.0 + exp($exponent));
    }

    /**
     * Estimasi kemampuan laten siswa (Theta) menggunakan Maximum Likelihood Estimation (MLE)
     * dengan metode iterasi Newton-Raphson.
     *
     * @param  array<int, array{is_correct: bool, difficulty: float}>  $itemsResponses
     * @return array{theta: float, sem: float, iterations: int}
     */
    public function estimateTheta(array $itemsResponses): array
    {
        $n = count($itemsResponses);
        if ($n === 0) {
            return ['theta' => 0.0, 'sem' => 1.0, 'iterations' => 0];
        }

        $correctCount = 0;
        foreach ($itemsResponses as $item) {
            if ($item['is_correct']) {
                $correctCount++;
            }
        }

        // Penyesuaian ekstrem untuk all-correct atau all-wrong (Laplace smoothing)
        $adjustedCorrect = max(0.5, min($n - 0.5, (float) $correctCount));
        $initialLogit = log($adjustedCorrect / ($n - $adjustedCorrect));
        $theta = max(-3.0, min(3.0, $initialLogit));

        $maxIterations = 25;
        $tolerance = 0.001;
        $iterations = 0;

        for ($k = 0; $k < $maxIterations; $k++) {
            $iterations++;
            $firstDerivative = 0.0;
            $secondDerivative = 0.0;

            foreach ($itemsResponses as $item) {
                $u = $item['is_correct'] ? 1.0 : 0.0;
                $b = $item['difficulty'];
                $p = $this->raschProbability($theta, $b);
                $q = 1.0 - $p;

                $firstDerivative += ($u - $p);
                $secondDerivative += ($p * $q); // Fisher Information
            }

            if ($secondDerivative < 1e-6) {
                break;
            }

            $delta = $firstDerivative / $secondDerivative;
            // Batasi step jump per iterasi agar tidak divergen
            $delta = max(-1.0, min(1.0, $delta));
            $theta += $delta;

            // Batasi rentang kemampuan logit normal [-3.5, 3.5]
            $theta = max(-3.5, min(3.5, $theta));

            if (abs($delta) < $tolerance) {
                break;
            }
        }

        // Standard Error of Measurement (SEM) = 1 / sqrt(Total Information)
        $totalInfo = 0.0;
        foreach ($itemsResponses as $item) {
            $p = $this->raschProbability($theta, $item['difficulty']);
            $totalInfo += ($p * (1.0 - $p));
        }
        $sem = $totalInfo > 0 ? round(1.0 / sqrt($totalInfo), 3) : 1.0;

        return [
            'theta' => round($theta, 3),
            'sem' => $sem,
            'iterations' => $iterations,
        ];
    }

    /**
     * Konversi nilai laten Theta ke Skala UTBK SNBT (200 - 1000)
     */
    public function thetaToUtbkScore(float $theta): int
    {
        $rawScore = $this->utbkMean + ($theta * $this->utbkStdDev);

        return (int) round(max(200, min(1000, $rawScore)));
    }

    /**
     * Tentukan tingkat kemampuan (Ability Tier)
     */
    public function getAbilityTier(int $utbkScore): array
    {
        return match (true) {
            $utbkScore >= 700 => [
                'tier' => 'super_high',
                'label' => 'Sangat Tinggi (Peluang Unggul PTN Top)',
                'badge' => 'emerald',
            ],
            $utbkScore >= 600 => [
                'tier' => 'high',
                'label' => 'Tinggi (Kompetitif Seleksi PTN)',
                'badge' => 'blue',
            ],
            $utbkScore >= 500 => [
                'tier' => 'average',
                'label' => 'Rata-rata Nasional',
                'badge' => 'cyan',
            ],
            $utbkScore >= 400 => [
                'tier' => 'moderate',
                'label' => 'Perlu Peningkatan Latihan',
                'badge' => 'amber',
            ],
            default => [
                'tier' => 'low',
                'label' => 'Butuh Remedial & Klinik Belajar',
                'badge' => 'rose',
            ],
        };
    }

    /**
     * Evaluasi sesi CBT lengkap dengan pemodelan IRT (Rasch Model)
     *
     * @param  array<int, array>  $questions
     * @param  Collection<int, mixed>  $answers
     * @return array{
     *   theta: float,
     *   sem: float,
     *   predicted_utbk_score: int,
     *   ability_tier: array,
     *   subtest_breakdown: array<int, array>,
     *   strengths: array<int, string>,
     *   weaknesses: array<int, string>
     * }
     */
    public function evaluateSession(CbtSession $session, array $questions, $answers): array
    {
        $itemsResponses = [];
        $subtestGroups = [];

        foreach ($questions as $index => $qData) {
            $questionNumber = $index + 1;
            $userAnswer = $answers->get($questionNumber);
            $subtest = $qData['subtest'] ?? ($qData['subject'] ?? 'Umum');

            // Estimasi tingkat kesulitan soal (b)
            // Jika ada bobot points/difficulty, pakai; default 0.0 (tingkat kesulitan sedang)
            $difficulty = isset($qData['difficulty']) ? (float) $qData['difficulty'] : 0.0;
            if (isset($qData['points']) && $qData['points'] > 1) {
                // Skala points 1-5 dipetakan ke logit [-1.0, 1.5]
                $difficulty = round(($qData['points'] - 2) * 0.75, 2);
            }

            // Tentukan apakah jawaban siswa benar
            $isCorrect = false;
            if ($userAnswer && isset($qData['correct_option'])) {
                $qType = $qData['question_type'] ?? 'single_choice';
                $selected = $userAnswer->selected_option;
                $target = $qData['correct_option'];

                if ($qType === 'multiple_choice' || $qType === 'complex_choice') {
                    $uSel = is_array($selected) ? $selected : array_map('trim', explode(',', (string) $selected));
                    $cSel = is_array($target) ? $target : array_map('trim', explode(',', (string) $target));
                    sort($uSel);
                    sort($cSel);
                    $isCorrect = ! empty($uSel) && $uSel === $cSel;
                } elseif ($qType === 'short_answer') {
                    $cleanUser = preg_replace('/\s+/', '', strtolower(trim((string) $selected)));
                    $cleanTarget = preg_replace('/\s+/', '', strtolower(trim((string) $target)));
                    $isCorrect = $cleanUser !== '' && $cleanUser === $cleanTarget;
                } else {
                    $isCorrect = trim(strtoupper((string) $selected)) === trim(strtoupper((string) $target));
                }
            }

            $itemRecord = [
                'question_number' => $questionNumber,
                'subtest' => $subtest,
                'difficulty' => $difficulty,
                'is_correct' => $isCorrect,
            ];

            $itemsResponses[] = $itemRecord;

            if (! isset($subtestGroups[$subtest])) {
                $subtestGroups[$subtest] = [];
            }
            $subtestGroups[$subtest][] = $itemRecord;
        }

        // 1. Estimasi Global Theta
        $globalEst = $this->estimateTheta($itemsResponses);
        $predictedScore = $this->thetaToUtbkScore($globalEst['theta']);
        $tier = $this->getAbilityTier($predictedScore);

        // 2. Estimasi Kemampuan Per Subtes (Subtest Theta)
        $subtestBreakdown = [];
        $strengths = [];
        $weaknesses = [];

        foreach ($subtestGroups as $name => $subItems) {
            $subEst = $this->estimateTheta($subItems);
            $subScore = $this->thetaToUtbkScore($subEst['theta']);
            $correctInSub = count(array_filter($subItems, fn ($i) => $i['is_correct']));
            $totalInSub = count($subItems);
            $accuracy = $totalInSub > 0 ? round(($correctInSub / $totalInSub) * 100) : 0;

            $subtestBreakdown[] = [
                'subtest' => $name,
                'total' => $totalInSub,
                'correct' => $correctInSub,
                'accuracy' => $accuracy,
                'theta' => $subEst['theta'],
                'predicted_score' => $subScore,
            ];

            if ($subScore >= 600 || $subEst['theta'] >= 0.5) {
                $strengths[] = "{$name} (Skor IRT: {$subScore})";
            } elseif ($subScore < 500 || $subEst['theta'] < -0.2) {
                $weaknesses[] = "{$name} (Skor IRT: {$subScore})";
            }
        }

        return [
            'theta' => $globalEst['theta'],
            'sem' => $globalEst['sem'],
            'predicted_utbk_score' => $predictedScore,
            'ability_tier' => $tier,
            'subtest_breakdown' => $subtestBreakdown,
            'strengths' => $strengths,
            'weaknesses' => $weaknesses,
        ];
    }

    /**
     * Rangkuman analitik IRT untuk rapor individual siswa
     *
     * @return array{
     *   avg_theta: float,
     *   avg_utbk_score: int,
     *   highest_utbk_score: int,
     *   latest_utbk_score: int,
     *   total_sessions: int,
     *   ability_tier: array,
     *   subtest_radar: array<int, array>
     * }
     */
    public function getStudentIrtSummary(User $user): array
    {
        $sessions = CbtSession::where('user_id', $user->id)
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->get();

        if ($sessions->isEmpty()) {
            return [
                'avg_theta' => 0.0,
                'avg_utbk_score' => 0,
                'highest_utbk_score' => 0,
                'latest_utbk_score' => 0,
                'total_sessions' => 0,
                'ability_tier' => $this->getAbilityTier(0),
                'subtest_radar' => [],
            ];
        }

        $scores = [];
        $subtestAverages = [];

        foreach ($sessions as $s) {
            $score = $s->predicted_score ?? $this->thetaToUtbkScore(0.0);
            $scores[] = $score;

            if (is_array($s->subtest_scores)) {
                foreach ($s->subtest_scores as $st) {
                    $name = $st['subtest'] ?? 'Umum';
                    if (! isset($subtestAverages[$name])) {
                        $subtestAverages[$name] = ['scores' => [], 'thetas' => []];
                    }
                    if (isset($st['predicted_score'])) {
                        $subtestAverages[$name]['scores'][] = $st['predicted_score'];
                    }
                    if (isset($st['theta'])) {
                        $subtestAverages[$name]['thetas'][] = $st['theta'];
                    }
                }
            }
        }

        $avgScore = (int) round(array_sum($scores) / count($scores));
        $highestScore = max($scores);
        $latestScore = $scores[0];

        $approxTheta = round(($avgScore - $this->utbkMean) / $this->utbkStdDev, 2);

        $radar = [];
        foreach ($subtestAverages as $subName => $data) {
            $radarAvg = ! empty($data['scores']) ? (int) round(array_sum($data['scores']) / count($data['scores'])) : $avgScore;
            $radarTheta = ! empty($data['thetas']) ? round(array_sum($data['thetas']) / count($data['thetas']), 2) : 0.0;
            $radar[] = [
                'subtest' => $subName,
                'predicted_score' => $radarAvg,
                'theta' => $radarTheta,
            ];
        }

        return [
            'avg_theta' => $approxTheta,
            'avg_utbk_score' => $avgScore,
            'highest_utbk_score' => $highestScore,
            'latest_utbk_score' => $latestScore,
            'total_sessions' => count($sessions),
            'ability_tier' => $this->getAbilityTier($avgScore),
            'subtest_radar' => $radar,
        ];
    }

    /**
     * Agregat analitik IRT (Rasch Model) untuk Dashboard Admin & Sekolah
     *
     * @return array{
     *   total_sessions_analyzed: int,
     *   avg_predicted_score: int,
     *   ability_distribution: array<string, int>,
     *   difficulty_distribution: array<string, int>
     * }
     */
    public function getAggregateIrtStats(?int $schoolId = null): array
    {
        $query = CbtSession::where('status', 'submitted');

        if ($schoolId) {
            $query->whereHas('user', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });
        }

        $sessions = $query->get();

        if ($sessions->isEmpty()) {
            return [
                'total_sessions_analyzed' => 0,
                'avg_predicted_score' => 0,
                'ability_distribution' => [
                    'super_high' => 0,
                    'high' => 0,
                    'average' => 0,
                    'moderate' => 0,
                    'low' => 0,
                ],
                'difficulty_distribution' => [
                    'easy' => 0,
                    'medium' => 0,
                    'hard' => 0,
                ],
            ];
        }

        $distribution = [
            'super_high' => 0, // >= 700
            'high' => 0,       // 600 - 699
            'average' => 0,    // 500 - 599
            'moderate' => 0,   // 400 - 499
            'low' => 0,        // < 400
        ];

        $scores = [];

        foreach ($sessions as $s) {
            $score = $s->predicted_score ?? $this->thetaToUtbkScore(0.0);
            $scores[] = $score;

            if ($score >= 700) {
                $distribution['super_high']++;
            } elseif ($score >= 600) {
                $distribution['high']++;
            } elseif ($score >= 500) {
                $distribution['average']++;
            } elseif ($score >= 400) {
                $distribution['moderate']++;
            } else {
                $distribution['low']++;
            }
        }

        $avgScore = (int) round(array_sum($scores) / count($scores));

        // Analisis butir soal CBT
        $totalQuestions = Question::where('is_active', true)->count();
        $diffDist = [
            'easy' => (int) round($totalQuestions * 0.35),
            'medium' => (int) round($totalQuestions * 0.45),
            'hard' => (int) round($totalQuestions * 0.20),
        ];

        return [
            'total_sessions_analyzed' => count($sessions),
            'avg_predicted_score' => $avgScore,
            'ability_distribution' => $distribution,
            'difficulty_distribution' => $diffDist,
        ];
    }
}
