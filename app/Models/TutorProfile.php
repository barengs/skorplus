<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialization',
        'alma_mater',
        'phone',
        'gender',
        'birth_year',
        'address',
        'social_media',
        'bio',
    ];

    protected function casts(): array
    {
        return [
            'birth_year' => 'integer',
            'social_media' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

