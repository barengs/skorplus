<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'has_certificate' => 'boolean',
        'is_popular' => 'boolean',
        'is_bestseller' => 'boolean',
        'rating' => 'float',
        'total_reviews' => 'integer',
    ];

    protected $appends = [
        'display_instructor',
        'display_program',
    ];

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function learningPackages()
    {
        return $this->belongsToMany(LearningPackage::class, 'learning_package_course')
            ->withPivot('sort_order');
    }

    public function modules()
    {
        return $this->hasMany(Module::class)->orderBy('sort_order');
    }

    public function lessons()
    {
        return $this->hasManyThrough(Lesson::class, Module::class);
    }

    public function enrollments()
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function reviews()
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function getDisplayInstructorAttribute(): string
    {
        return $this->instructor_name ?: ($this->instructor?->name ?? 'Tutor SkorPluss');
    }

    public function getDisplayProgramAttribute(): string
    {
        return $this->program_name ?: ($this->program?->name ?? 'Program Intensif');
    }
}
