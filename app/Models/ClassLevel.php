<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ClassLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'category',
        'description',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function studentProfiles(): HasMany
    {
        return $this->hasMany(StudentProfile::class, 'class_level_id');
    }

    public function userProfiles(): HasMany
    {
        return $this->hasMany(UserProfile::class, 'class_level_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Resolve class_level_id and class_level label from either an ID or a text input.
     *
     * @return array{class_level_id: int|null, class_level: string|null}
     */
    public static function resolvePair(?int $classLevelId = null, ?string $classLevelName = null): array
    {
        if ($classLevelId) {
            $found = static::find($classLevelId);
            if ($found) {
                return [
                    'class_level_id' => $found->id,
                    'class_level' => $found->name,
                ];
            }
        }

        if ($classLevelName !== null && trim($classLevelName) !== '') {
            $clean = trim($classLevelName);
            $slug = Str::slug($clean);

            $found = static::where('name', $clean)
                ->orWhere('slug', $slug)
                ->orWhereRaw('LOWER(name) = ?', [strtolower($clean)])
                ->first();

            if ($found) {
                return [
                    'class_level_id' => $found->id,
                    'class_level' => $found->name,
                ];
            }

            return [
                'class_level_id' => null,
                'class_level' => $clean,
            ];
        }

        return [
            'class_level_id' => null,
            'class_level' => null,
        ];
    }
}

