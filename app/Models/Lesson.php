<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'quiz_questions' => 'array',
        'is_preview' => 'boolean',
        'min_pass_score' => 'integer',
        'duration_seconds' => 'integer',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $lesson): void {
            if ($lesson->content !== null) {
                $lesson->content = self::normalizeRichText($lesson->content);
            }
            if ($lesson->summary !== null) {
                $lesson->summary = self::normalizeRichText($lesson->summary);
            }
        });
    }

    public static function normalizeRichText(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        return str_replace(
            ['&nbsp;', '&NBSP;', '&#160;', "\u{00A0}", '&shy;', "\u{00AD}", '&#8203;', "\u{200B}"],
            [' ', ' ', ' ', ' ', '', '', '', ''],
            $html
        );
    }

    public function getContentAttribute(?string $value): ?string
    {
        return self::normalizeRichText($value);
    }

    public function getSummaryAttribute(?string $value): ?string
    {
        return self::normalizeRichText($value);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }
}
