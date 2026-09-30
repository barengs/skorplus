<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolContractRenewal extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_learning_package_id',
        'contract_number',
        'renewal_type',
        'previous_end_date',
        'new_end_date',
        'quota_students',
        'renewed_by',
        'renewal_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'previous_end_date' => 'date',
            'new_end_date' => 'date',
            'renewal_date' => 'date',
            'quota_students' => 'integer',
        ];
    }

    public function schoolLearningPackage(): BelongsTo
    {
        return $this->belongsTo(SchoolLearningPackage::class);
    }

    public function renewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'renewed_by');
    }
}
