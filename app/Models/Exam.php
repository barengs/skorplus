<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $guarded = ['id'];
    public function questions() { return $this->belongsToMany(Question::class, 'exam_questions'); }
}