<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CbtSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'exam_type',
        'exam_title',
        'started_at',
        'submitted_at',
        'score',
        'duration_seconds',
        'status', // ongoing, submitted, expired
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CbtAnswer::class);
    }
}
