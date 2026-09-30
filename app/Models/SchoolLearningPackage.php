<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolLearningPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'learning_package_id',
        'current_contract_number',
        'start_date',
        'end_date',
        'max_students',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'max_students' => 'integer',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function learningPackage(): BelongsTo
    {
        return $this->belongsTo(LearningPackage::class);
    }

    public function renewals(): HasMany
    {
        return $this->hasMany(SchoolContractRenewal::class)->orderBy('id', 'desc');
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->end_date && $this->end_date->isPast();
    }

    public function getDaysRemainingAttribute(): int
    {
        if (! $this->end_date) {
            return 0;
        }
        $diff = now()->startOfDay()->diffInDays($this->end_date->startOfDay(), false);

        return (int) $diff;
    }
}
