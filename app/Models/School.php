<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'npsn',
        'email',
        'phone',
        'address',
        'logo',
        'photo',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(User::class)->role('siswa', 'api');
    }

    public function admins(): HasMany
    {
        return $this->hasMany(User::class)->role('admin_sekolah', 'api');
    }

    public function learningPackages(): BelongsToMany
    {
        return $this->belongsToMany(LearningPackage::class, 'school_learning_packages')
            ->withPivot(['current_contract_number', 'start_date', 'end_date', 'max_students', 'status'])
            ->withTimestamps();
    }

    public function activeLearningPackages(): BelongsToMany
    {
        return $this->learningPackages()
            ->wherePivot('status', 'active')
            ->wherePivot('end_date', '>=', now()->toDateString());
    }
}
