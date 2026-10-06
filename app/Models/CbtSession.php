<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'exam_id',
        'exam_type',
        'exam_title',
        'started_at',
        'submitted_at',
        'score',
        'duration_seconds',
        'status', // ongoing, submitted, expired
        'total_score',
        'subtest_scores',
        'question_order',
        'strengths',
        'weaknesses',
        'predicted_score',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'subtest_scores' => 'array',
            'question_order' => 'array',
            'strengths' => 'array',
            'weaknesses' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(CbtAnswer::class);
    }

    /**
     * Auto-submit ongoing sessions that have exceeded their duration,
     * and delete/cleanup unattempted abandoned sessions with 0 answers.
     */
    public static function autoSubmitExpiredSessions(): int
    {
        $expiredSessions = self::where('status', 'ongoing')
            ->whereNotNull('started_at')
            ->get()
            ->filter(function ($session) {
                $duration = (int) ($session->duration_seconds ?: 5400);

                // Berikan toleransi grace period 60 detik + 15 detik buffer sebelum auto-submit server
                return $session->started_at->copy()->addSeconds($duration + 75)->isPast();
            });

        $count = 0;
        foreach ($expiredSessions as $session) {
            $answeredCount = $session->answers()->whereNotNull('selected_option')->count();

            // Jangan catat ujian bila tidak dikerjakan sama sekali (0 jawaban)
            if ($answeredCount === 0) {
                $session->answers()->delete();
                $session->delete();

                continue;
            }

            self::gradeAndSubmitSession($session);
            $count++;
        }

        return $count;
    }

    /**
     * Grade and finalize a session.
     */
    public static function gradeAndSubmitSession(self $session): void
    {
        $questions = $session->question_order;
        if (empty($questions) && $session->exam_id) {
            $exam = Exam::with(['questions.options', 'questions.examType'])->find($session->exam_id);
            if ($exam) {
                $questions = $exam->questions->map(function ($q, $idx) {
                    return [
                        'number' => $idx + 1,
                        'id' => $q->id,
                        'question_type' => $q->question_type ?? 'single_choice',
                        'options' => $q->options->pluck('option_text', 'option_key')->toArray(),
                        'correct_option' => $q->options->firstWhere('is_correct', true)?->option_key,
                        'points' => $q->points ?? 1,
                    ];
                })->toArray();
            }
        }

        $questions = $questions ?: [];

        $answers = $session->answers()
            ->whereNotNull('selected_option')
            ->get()
            ->keyBy('question_number');

        $totalScore = 0;
        $correctCount = 0;
        $totalQuestions = count($questions);

        foreach ($questions as $index => $questionData) {
            $questionNumber = $index + 1;
            $userAnswer = $answers->get($questionNumber);
            $isCorrect = false;

            if ($userAnswer && isset($questionData['correct_option'])) {
                $qType = $questionData['question_type'] ?? 'single_choice';

                if ($qType === 'multiple_choice' || $qType === 'complex_choice') {
                    $userSelected = is_array($userAnswer->selected_option)
                        ? $userAnswer->selected_option
                        : array_map('trim', explode(',', (string) $userAnswer->selected_option));
                    $correctKeys = is_array($questionData['correct_option'])
                        ? $questionData['correct_option']
                        : array_map('trim', explode(',', (string) $questionData['correct_option']));
                    sort($userSelected);
                    sort($correctKeys);
                    if (! empty($userSelected) && $userSelected === $correctKeys) {
                        $isCorrect = true;
                    }
                } elseif ($qType === 'short_answer') {
                    $cleanUser = preg_replace('/\s+/', '', strtolower(trim((string) $userAnswer->selected_option)));
                    $cleanTarget = preg_replace('/\s+/', '', strtolower(trim((string) $questionData['correct_option'])));
                    if ($cleanUser !== '' && $cleanUser === $cleanTarget) {
                        $isCorrect = true;
                    }
                } else {
                    if (trim(strtoupper((string) $userAnswer->selected_option)) === trim(strtoupper((string) $questionData['correct_option']))) {
                        $isCorrect = true;
                    }
                }
            }

            if ($isCorrect) {
                $correctCount++;
                $totalScore += $questionData['points'] ?? 1;
            }
        }

        $maxScore = $totalQuestions;
        $normalizedScore = $maxScore > 0 ? (int) round(($correctCount / $maxScore) * 100) : 0;

        $submittedAt = $session->started_at
            ? $session->started_at->copy()->addSeconds($session->duration_seconds ?? 5400)
            : now();
        if ($submittedAt->isFuture()) {
            $submittedAt = now();
        }

        $session->update([
            'status' => 'submitted',
            'submitted_at' => $submittedAt,
            'score' => $normalizedScore,
            'total_score' => $totalScore,
        ]);
    }
}
