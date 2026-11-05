<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'class_level_id',
        'class_level',
        'phone',
        'gender',
        'birth_year',
        'target_campus',
        'address',
        'social_media',
        'bio',
    ];

    protected function casts(): array
    {
        return [
            'class_level_id' => 'integer',
            'birth_year' => 'integer',
            'social_media' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'class_level_id');
    }
}

