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
        'is_published',
        'cbt_quota',
    ];

    protected $casts = [
        'features' => 'array',
        'is_published' => 'boolean',
        'cbt_quota' => 'integer',
    ];

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'learning_package_course')
            ->withPivot('sort_order')
            ->orderBy('learning_package_course.sort_order');
    }

    public function exams()
    {
        return $this->belongsToMany(Exam::class, 'learning_package_exam');
    }

    public function getCbtUsageForUser(?User $user): array
    {
        if (! $user) {
            return [
                'quota' => $this->cbt_quota,
                'used' => 0,
                'remaining' => $this->cbt_quota,
                'is_limit_reached' => false,
                'is_unlimited' => $this->cbt_quota === null || $this->cbt_quota <= 0,
            ];
        }

        $used = CbtSession::where('user_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->count();
        $isUnlimited = $this->cbt_quota === null || $this->cbt_quota <= 0;
        $quota = $isUnlimited ? null : (int) $this->cbt_quota;
        $remaining = $isUnlimited ? null : max(0, $quota - $used);
        $isLimitReached = ! $isUnlimited && $used >= $quota;

        return [
            'quota' => $quota,
            'used' => $used,
            'remaining' => $remaining,
            'is_limit_reached' => $isLimitReached,
            'is_unlimited' => $isUnlimited,
        ];
    }
}
