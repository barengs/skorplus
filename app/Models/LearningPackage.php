<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'discount_price',
        'thumbnail',
        'features',
        'is_published'
    ];

    protected $casts = [
        'features' => 'array',
        'is_published' => 'boolean',
    ];

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'learning_package_course')
                    ->withPivot('sort_order')
                    ->orderBy('learning_package_course.sort_order');
    }
}
