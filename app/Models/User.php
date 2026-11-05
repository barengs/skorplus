<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, HasRoles, Notifiable;

    protected string $guard_name = 'api';

    protected $fillable = [
        'name',
        'email',
        'password',
        'nisn',
        'school',
        'school_id',
        'phone',
        'program',
        'is_active',
        'avatar',
        'trial_ends_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'trial_ends_at' => 'datetime',
        ];
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at !== null && $this->trial_ends_at->isFuture();
    }

    public function trialDaysRemaining(): int
    {
        if (! $this->isOnTrial()) {
            return 0;
        }

        return (int) ceil(now()->diffInSeconds($this->trial_ends_at, false) / 86400);
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'roles' => $this->getRoleNames(),
        ];
    }

    public function schoolEntity(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function tutorProfile(): HasOne
    {
        return $this->hasOne(TutorProfile::class);
    }

    public function schoolAdminProfile(): HasOne
    {
        return $this->hasOne(SchoolAdminProfile::class);
    }

    public function adminProfile(): HasOne
    {
        return $this->hasOne(AdminProfile::class);
    }

    public function primaryRoleName(): string
    {
        return $this->getRoleNames()->first() ?? 'siswa';
    }

    /**
     * Synchronize profile data into the role-specific profile table and backward-compatible user_profiles.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function syncRoleProfile(array $attributes): void
    {
        $role = $attributes['role'] ?? $this->primaryRoleName();

        $resolvedClass = ClassLevel::resolvePair(
            isset($attributes['class_level_id']) && $attributes['class_level_id'] !== '' ? (int) $attributes['class_level_id'] : null,
            $attributes['class_level'] ?? null
        );

        $hasClassInput = array_key_exists('class_level', $attributes) || array_key_exists('class_level_id', $attributes);

        $this->loadMissing(['profile', 'studentProfile', 'tutorProfile', 'schoolAdminProfile', 'adminProfile']);

        $phone = array_key_exists('phone', $attributes) ? $attributes['phone'] : ($this->profile?->phone ?? $this->phone);
        $gender = array_key_exists('gender', $attributes) ? $attributes['gender'] : $this->profile?->gender;
        $birthYear = array_key_exists('birth_year', $attributes) ? $attributes['birth_year'] : $this->profile?->birth_year;
        $address = array_key_exists('address', $attributes) ? $attributes['address'] : $this->profile?->address;
        $bio = array_key_exists('bio', $attributes) ? $attributes['bio'] : $this->profile?->bio;
        $socialMedia = array_key_exists('social_media', $attributes) ? $attributes['social_media'] : $this->profile?->social_media;

        $classLevelId = $hasClassInput
            ? $resolvedClass['class_level_id']
            : ($this->studentProfile?->class_level_id ?? $this->profile?->class_level_id);
        $classLevelName = $hasClassInput
            ? $resolvedClass['class_level']
            : ($this->studentProfile?->class_level ?? $this->profile?->class_level);

        if ($role === 'admin') {
            $this->adminProfile()->updateOrCreate(
                ['user_id' => $this->id],
                [
                    'position' => array_key_exists('position', $attributes) ? $attributes['position'] : ($this->adminProfile?->position ?? 'Administrator Sistem'),
                    'department' => array_key_exists('department', $attributes) ? $attributes['department'] : ($this->adminProfile?->department ?? 'Manajemen Pusat'),
                    'phone' => $phone,
                    'bio' => $bio,
                ]
            );
        } elseif ($role === 'admin_sekolah') {
            $this->schoolAdminProfile()->updateOrCreate(
                ['user_id' => $this->id],
                [
                    'position' => array_key_exists('position', $attributes) ? $attributes['position'] : ($this->schoolAdminProfile?->position ?? 'Koordinator Sekolah'),
                    'nip' => array_key_exists('nip', $attributes) ? $attributes['nip'] : $this->schoolAdminProfile?->nip,
                    'phone' => $phone,
                    'gender' => $gender,
                    'address' => $address,
                    'bio' => $bio,
                ]
            );
        } elseif ($role === 'tutor') {
            $this->tutorProfile()->updateOrCreate(
                ['user_id' => $this->id],
                [
                    'specialization' => array_key_exists('specialization', $attributes) ? $attributes['specialization'] : $this->tutorProfile?->specialization,
                    'alma_mater' => array_key_exists('alma_mater', $attributes) ? $attributes['alma_mater'] : ($this->tutorProfile?->alma_mater ?? $this->school),
                    'phone' => $phone,
                    'gender' => $gender,
                    'birth_year' => $birthYear,
                    'address' => $address,
                    'social_media' => $socialMedia,
                    'bio' => $bio,
                ]
            );
        } else {
            $this->studentProfile()->updateOrCreate(
                ['user_id' => $this->id],
                [
                    'class_level_id' => $classLevelId,
                    'class_level' => $classLevelName,
                    'phone' => $phone,
                    'gender' => $gender,
                    'birth_year' => $birthYear,
                    'target_campus' => array_key_exists('target_campus', $attributes) ? $attributes['target_campus'] : $this->studentProfile?->target_campus,
                    'address' => $address,
                    'social_media' => $socialMedia,
                    'bio' => $bio,
                ]
            );
        }

        // Keep user_profiles synced for backward-compatibility
        $this->profile()->updateOrCreate(
            ['user_id' => $this->id],
            [
                'class_level_id' => $classLevelId,
                'class_level' => $classLevelName,
                'phone' => $phone,
                'gender' => $gender,
                'birth_year' => $birthYear,
                'address' => $address,
                'social_media' => $socialMedia,
                'bio' => $bio,
            ]
        );
    }

    /**
     * Get normalized profile attributes from the active role-specific profile table.
     *
     * @return array<string, mixed>
     */
    public function resolvedProfileAttributes(): array
    {
        $this->loadMissing(['profile', 'studentProfile', 'tutorProfile', 'schoolAdminProfile', 'adminProfile']);

        $role = $this->primaryRoleName();
        $legacy = $this->profile;

        if ($role === 'admin' && $this->adminProfile) {
            $p = $this->adminProfile;

            return [
                'profile_type' => 'admin_profile',
                'phone' => $p->phone ?? $legacy?->phone ?? $this->phone,
                'gender' => $legacy?->gender,
                'birth_year' => $legacy?->birth_year,
                'address' => $legacy?->address,
                'bio' => $p->bio ?? $legacy?->bio,
                'social_media' => $legacy?->social_media ?? (object) [],
                'position' => $p->position,
                'department' => $p->department,
                'nip' => null,
                'specialization' => null,
                'alma_mater' => null,
                'class_level_id' => null,
                'class_level' => null,
                'target_campus' => null,
            ];
        }

        if ($role === 'admin_sekolah' && $this->schoolAdminProfile) {
            $p = $this->schoolAdminProfile;

            return [
                'profile_type' => 'school_admin_profile',
                'phone' => $p->phone ?? $legacy?->phone ?? $this->phone,
                'gender' => $p->gender ?? $legacy?->gender,
                'birth_year' => $legacy?->birth_year,
                'address' => $p->address ?? $legacy?->address,
                'bio' => $p->bio ?? $legacy?->bio,
                'social_media' => $legacy?->social_media ?? (object) [],
                'position' => $p->position,
                'department' => null,
                'nip' => $p->nip,
                'specialization' => null,
                'alma_mater' => null,
                'class_level_id' => null,
                'class_level' => null,
                'target_campus' => null,
            ];
        }

        if ($role === 'tutor' && $this->tutorProfile) {
            $p = $this->tutorProfile;

            return [
                'profile_type' => 'tutor_profile',
                'phone' => $p->phone ?? $legacy?->phone ?? $this->phone,
                'gender' => $p->gender ?? $legacy?->gender,
                'birth_year' => $p->birth_year ?? $legacy?->birth_year,
                'address' => $p->address ?? $legacy?->address,
                'bio' => $p->bio ?? $legacy?->bio,
                'social_media' => $p->social_media ?? $legacy?->social_media ?? (object) [],
                'position' => null,
                'department' => null,
                'nip' => null,
                'specialization' => $p->specialization,
                'alma_mater' => $p->alma_mater ?? $this->school,
                'class_level_id' => null,
                'class_level' => null,
                'target_campus' => null,
            ];
        }

        $sp = $this->studentProfile;

        return [
            'profile_type' => 'student_profile',
            'phone' => $sp?->phone ?? $legacy?->phone ?? $this->phone,
            'gender' => $sp?->gender ?? $legacy?->gender,
            'birth_year' => $sp?->birth_year ?? $legacy?->birth_year,
            'address' => $sp?->address ?? $legacy?->address,
            'bio' => $sp?->bio ?? $legacy?->bio,
            'social_media' => $sp?->social_media ?? $legacy?->social_media ?? (object) [],
            'position' => null,
            'department' => null,
            'nip' => null,
            'specialization' => null,
            'alma_mater' => null,
            'class_level_id' => $sp?->class_level_id ?? $legacy?->class_level_id,
            'class_level' => $sp?->class_level ?? $legacy?->class_level,
            'target_campus' => $sp?->target_campus,
        ];
    }

    public function cbtSessions(): HasMany
    {
        return $this->hasMany(CbtSession::class);
    }

    public function forumPosts(): HasMany
    {
        return $this->hasMany(ForumPost::class);
    }

    public function dailyCheckins(): HasMany
    {
        return $this->hasMany(DailyCheckin::class);
    }
}
