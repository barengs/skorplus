<?php

namespace App\Services;

use App\Models\LessonProgress;
use App\Models\User;

class KnowledgeTracingService
{
    /**
     * Parameter default Bayesian Knowledge Tracing (BKT)
     * Standard Corbett & Anderson model for educational testing.
     */
    protected float $pL0 = 0.20; // Prior: Probabilitas awal siswa memahami topik

    protected float $pT = 0.15;  // Transition: Probabilitas bertambah paham setelah latihan

    protected float $pG = 0.20;  // Guess: Probabilitas tebak benar (1 dari 5 pilihan ganda)

    protected float $pS = 0.10;  // Slip: Probabilitas teledor / salah padahal paham

    /**
     * Set parameter kustom jika dibutuhkan (misal per topik/kategori).
     */
    public function setParameters(float $pL0, float $pT, float $pG, float $pS): self
    {
        $this->pL0 = max(0.01, min(0.99, $pL0));
        $this->pT = max(0.01, min(0.99, $pT));
        $this->pG = max(0.01, min(0.99, $pG));
        $this->pS = max(0.01, min(0.99, $pS));

        return $this;
    }

    /**
     * Update probabilitas pemahaman siswa setelah 1 butir respons (Bayesian Update + State Transition).
     *
     * @param  float  $priorKnowledge  Probabilitas pemahaman sebelum butir ini (0.0 - 1.0)
     * @param  bool  $isCorrect  Apakah siswa menjawab benar
     * @return float Probabilitas pemahaman baru (0.0 - 1.0)
     */
    public function updateStep(float $priorKnowledge, bool $isCorrect): float
    {
        $pL = max(0.01, min(0.99, $priorKnowledge));

        // 1. Bayesian Inference (Observation Update)
        if ($isCorrect) {
            $numerator = $pL * (1.0 - $this->pS);
            $denominator = $numerator + ((1.0 - $pL) * $this->pG);
        } else {
            $numerator = $pL * $this->pS;
            $denominator = $numerator + ((1.0 - $pL) * (1.0 - $this->pG));
        }

        $posterior = $denominator > 0 ? ($numerator / $denominator) : $pL;

        // 2. Learning Transition to Next Step
        $nextKnowledge = $posterior + ((1.0 - $posterior) * $this->pT);

        return round(min(0.99, max(0.01, $nextKnowledge)), 4);
    }

    /**
     * Evaluasi deretan respons jawaban kuis (array boolean atau array of evaluation items)
     *
     * @param  array<int, bool|array>  $evaluations
     * @return array{
     *   probability: float,
     *   mastery_percentage: int,
     *   status: string,
     *   status_label: string,
     *   badge_color: string,
     *   trajectory: float[]
     * }
     */
    public function evaluateResponses(array $evaluations, ?float $initialP = null): array
    {
        $currentP = $initialP ?? $this->pL0;
        $trajectory = [$currentP];

        foreach ($evaluations as $item) {
            $isCorrect = is_array($item) ? (bool) ($item['is_correct'] ?? false) : (bool) $item;
            $currentP = $this->updateStep($currentP, $isCorrect);
            $trajectory[] = $currentP;
        }

        $percentage = (int) round($currentP * 100);

        [$status, $statusLabel, $badgeColor] = match (true) {
            $percentage >= 80 => ['mastered', 'Sangat Menguasai (Mastered)', 'emerald'],
            $percentage >= 65 => ['proficient', 'Cukup Kompeten', 'blue'],
            $percentage >= 50 => ['developing', 'Sedang Berkembang', 'amber'],
            default => ['needs_remedial', 'Perlu Pendalaman Materi', 'rose'],
        };

        return [
            'probability' => $currentP,
            'mastery_percentage' => $percentage,
            'status' => $status,
            'status_label' => $statusLabel,
            'badge_color' => $badgeColor,
            'trajectory' => $trajectory,
        ];
    }

    /**
     * Analisis tingkat penguasaan topik/modul siswa secara komprehensif
     * berdasarkan riwayat pengerjaan kuis pada semua kursus/modul.
     *
     * @return array{
     *   overall_mastery_percentage: int,
     *   overall_probability: float,
     *   mastered_topics_count: int,
     *   developing_topics_count: int,
     *   remedial_topics_count: int,
     *   modules: array<int, array>,
     *   strengths: array<int, string>,
     *   needs_attention: array<int, string>
     * }
     */
    public function getStudentTopicMastery(User $user): array
    {
        $progresses = LessonProgress::with(['lesson.module.course'])
            ->where('user_id', $user->id)
            ->whereNotNull('quiz_attempt_data')
            ->get();

        if ($progresses->isEmpty()) {
            return [
                'overall_mastery_percentage' => 0,
                'overall_probability' => 0.0,
                'mastered_topics_count' => 0,
                'developing_topics_count' => 0,
                'remedial_topics_count' => 0,
                'modules' => [],
                'strengths' => [],
                'needs_attention' => [],
            ];
        }

        $modulesMap = [];

        foreach ($progresses as $prog) {
            $lesson = $prog->lesson;
            if (! $lesson) {
                continue;
            }

            $module = $lesson->module;
            $course = $module?->course;

            $courseTitle = $course?->title ?? 'Kursus Umum';
            $moduleTitle = $module?->title ?? $lesson->title;
            $moduleId = $module?->id ?? $lesson->id;

            if (! isset($modulesMap[$moduleId])) {
                $modulesMap[$moduleId] = [
                    'module_id' => $moduleId,
                    'module_title' => $moduleTitle,
                    'course_title' => $courseTitle,
                    'responses' => [],
                    'score_percentages' => [],
                    'attempts_count' => 0,
                ];
            }

            $attemptData = $prog->quiz_attempt_data ?? [];
            $evaluations = $attemptData['evaluations'] ?? [];

            foreach ($evaluations as $ev) {
                $modulesMap[$moduleId]['responses'][] = (bool) ($ev['is_correct'] ?? false);
            }

            if (isset($attemptData['score_percentage'])) {
                $modulesMap[$moduleId]['score_percentages'][] = $attemptData['score_percentage'];
            }
            $modulesMap[$moduleId]['attempts_count']++;
        }

        $moduleResults = [];
        $totalProbability = 0;
        $masteredCount = 0;
        $developingCount = 0;
        $remedialCount = 0;
        $strengths = [];
        $needsAttention = [];

        foreach ($modulesMap as $modData) {
            $bktResult = $this->evaluateResponses($modData['responses']);

            $resultItem = [
                'module_id' => $modData['module_id'],
                'module_title' => $modData['module_title'],
                'course_title' => $modData['course_title'],
                'total_questions_attempted' => count($modData['responses']),
                'mastery_percentage' => $bktResult['mastery_percentage'],
                'probability' => $bktResult['probability'],
                'status' => $bktResult['status'],
                'status_label' => $bktResult['status_label'],
                'badge_color' => $bktResult['badge_color'],
                'avg_score' => ! empty($modData['score_percentages']) ? round(array_sum($modData['score_percentages']) / count($modData['score_percentages']), 1) : 0,
            ];

            $totalProbability += $bktResult['probability'];

            if ($bktResult['status'] === 'mastered') {
                $masteredCount++;
                $strengths[] = "{$modData['course_title']} - {$modData['module_title']} ({$bktResult['mastery_percentage']}%)";
            } elseif ($bktResult['status'] === 'proficient' || $bktResult['status'] === 'developing') {
                $developingCount++;
            } else {
                $remedialCount++;
                $needsAttention[] = "{$modData['course_title']} - {$modData['module_title']} ({$bktResult['mastery_percentage']}%)";
            }

            $moduleResults[] = $resultItem;
        }

        $count = count($moduleResults);
        $overallProb = $count > 0 ? round($totalProbability / $count, 4) : 0.0;
        $overallPercentage = (int) round($overallProb * 100);

        return [
            'overall_mastery_percentage' => $overallPercentage,
            'overall_probability' => $overallProb,
            'mastered_topics_count' => $masteredCount,
            'developing_topics_count' => $developingCount,
            'remedial_topics_count' => $remedialCount,
            'modules' => $moduleResults,
            'strengths' => array_slice($strengths, 0, 5),
            'needs_attention' => array_slice($needsAttention, 0, 5),
        ];
    }

    /**
     * Agregat statistik BKT di level sekolah atau global untuk Admin Dashboard
     *
     * @return array{
     *   total_students_evaluated: int,
     *   distribution: array<string, int>,
     *   challenging_topics: array<int, array>,
     *   top_mastered_topics: array<int, array>
     * }
     */
    public function getAggregateBktStats(?int $schoolId = null): array
    {
        $query = LessonProgress::with(['lesson.module.course', 'user'])
            ->whereNotNull('quiz_attempt_data');

        if ($schoolId) {
            $query->whereHas('user', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });
        }

        $allProgresses = $query->get();

        if ($allProgresses->isEmpty()) {
            return [
                'total_students_evaluated' => 0,
                'distribution' => [
                    'mastered' => 0,
                    'proficient' => 0,
                    'developing' => 0,
                    'needs_remedial' => 0,
                ],
                'challenging_topics' => [],
                'top_mastered_topics' => [],
            ];
        }

        // Hitung penguasaan per topik secara kolektif
        $topicAggregates = [];
        $userStudentIds = [];

        foreach ($allProgresses as $prog) {
            $userStudentIds[$prog->user_id] = true;
            $lesson = $prog->lesson;
            if (! $lesson) {
                continue;
            }

            $topicKey = $lesson->module?->title ?? $lesson->title;
            $courseTitle = $lesson->module?->course?->title ?? 'Materi';

            if (! isset($topicAggregates[$topicKey])) {
                $topicAggregates[$topicKey] = [
                    'topic' => $topicKey,
                    'course' => $courseTitle,
                    'responses' => [],
                    'attempts' => 0,
                ];
            }

            $attemptData = $prog->quiz_attempt_data ?? [];
            $evaluations = $attemptData['evaluations'] ?? [];
            foreach ($evaluations as $ev) {
                $topicAggregates[$topicKey]['responses'][] = (bool) ($ev['is_correct'] ?? false);
            }
            $topicAggregates[$topicKey]['attempts']++;
        }

        $distribution = [
            'mastered' => 0,
            'proficient' => 0,
            'developing' => 0,
            'needs_remedial' => 0,
        ];

        $topicScores = [];
        foreach ($topicAggregates as $topicData) {
            $eval = $this->evaluateResponses($topicData['responses']);
            $distribution[$eval['status']]++;

            $topicScores[] = [
                'topic' => $topicData['topic'],
                'course' => $topicData['course'],
                'mastery_percentage' => $eval['mastery_percentage'],
                'probability' => $eval['probability'],
                'status_label' => $eval['status_label'],
                'attempts' => $topicData['attempts'],
            ];
        }

        // Urutkan materi paling dikuasai dan paling butuh perhatian
        usort($topicScores, fn ($a, $b) => $b['mastery_percentage'] <=> $a['mastery_percentage']);
        $topMastered = array_slice($topicScores, 0, 5);

        usort($topicScores, fn ($a, $b) => $a['mastery_percentage'] <=> $b['mastery_percentage']);
        $challenging = array_slice($topicScores, 0, 5);

        return [
            'total_students_evaluated' => count($userStudentIds),
            'distribution' => $distribution,
            'challenging_topics' => $challenging,
            'top_mastered_topics' => $topMastered,
        ];
    }
}
