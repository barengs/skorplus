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

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }
}
