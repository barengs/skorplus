<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'action',
        'module',
        'description',
        'entity_type',
        'entity_id',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a new audit log entry conveniently.
     */
    public static function record(
        string $action,
        string $description,
        string $module = 'general',
        ?Model $entity = null,
        ?array $metadata = null,
        ?User $user = null
    ): self {
        $actor = $user ?? auth('api')->user() ?? auth()->user();

        return self::create([
            'user_id' => $actor?->id,
            'user_name' => $actor?->name ?? 'Guest / Sistem',
            'user_role' => $actor ? ($actor->getRoleNames()->first() ?? 'user') : 'system',
            'action' => strtoupper($action),
            'module' => $module,
            'description' => $description,
            'entity_type' => $entity ? class_basename($entity) : null,
            'entity_id' => $entity?->getKey(),
            'ip_address' => request()->ip(),
            'user_agent' => substr((string) request()->userAgent(), 0, 500),
            'metadata' => $metadata,
        ]);
    }
}
