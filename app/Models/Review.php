<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Review extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'rating' => 'integer',
        'is_published' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewable(): MorphTo
    {
        return $this->morphTo();
    }

    public static function recalculateFor(Model $reviewable): void
    {
        $avg = $reviewable->reviews()->where('is_published', true)->avg('rating') ?: 0.0;
        $count = $reviewable->reviews()->where('is_published', true)->count();

        $reviewable->update([
            'rating' => round((float) $avg, 1),
            'total_reviews' => (int) $count,
        ]);
    }
}
