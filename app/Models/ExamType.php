<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'icon',
        'duration_seconds',
        'total_questions',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'total_questions' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}
