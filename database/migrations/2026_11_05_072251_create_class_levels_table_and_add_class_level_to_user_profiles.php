<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Master table: class_levels
        if (! Schema::hasTable('class_levels')) {
            Schema::create('class_levels', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('slug', 100)->unique();
                $table->string('category', 50)->nullable(); // e.g., SMA/MA/SMK, SMP/MTs, Umum
                $table->string('description')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. Role-specific table: student_profiles
        if (! Schema::hasTable('student_profiles')) {
            Schema::create('student_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
                $table->foreignId('class_level_id')->nullable()->constrained('class_levels')->nullOnDelete();
                $table->string('class_level', 100)->nullable();
                $table->string('phone', 30)->nullable();
                $table->string('gender', 20)->nullable();
                $table->unsignedSmallInteger('birth_year')->nullable();
                $table->string('target_campus')->nullable();
                $table->text('address')->nullable();
                $table->json('social_media')->nullable();
                $table->text('bio')->nullable();
                $table->timestamps();
            });
        }

        // 3. Role-specific table: tutor_profiles
        if (! Schema::hasTable('tutor_profiles')) {
            Schema::create('tutor_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
                $table->string('specialization')->nullable();
                $table->string('alma_mater')->nullable();
                $table->string('phone', 30)->nullable();
                $table->string('gender', 20)->nullable();
                $table->unsignedSmallInteger('birth_year')->nullable();
                $table->text('address')->nullable();
                $table->json('social_media')->nullable();
                $table->text('bio')->nullable();
                $table->timestamps();
            });
        }

        // 4. Role-specific table: school_admin_profiles
        if (! Schema::hasTable('school_admin_profiles')) {
            Schema::create('school_admin_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
                $table->string('position', 100)->nullable();
                $table->string('nip', 50)->nullable();
                $table->string('phone', 30)->nullable();
                $table->string('gender', 20)->nullable();
                $table->text('address')->nullable();
                $table->text('bio')->nullable();
                $table->timestamps();
            });
        }

        // 5. Role-specific table: admin_profiles
        if (! Schema::hasTable('admin_profiles')) {
            Schema::create('admin_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
                $table->string('position', 100)->nullable();
                $table->string('department', 100)->nullable();
                $table->string('phone', 30)->nullable();
                $table->text('bio')->nullable();
                $table->timestamps();
            });
        }

        // 6. Keep user_profiles backward-compatible with class_level columns
        if (Schema::hasTable('user_profiles') && ! Schema::hasColumn('user_profiles', 'class_level_id')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->foreignId('class_level_id')->nullable()->after('user_id')->constrained('class_levels')->nullOnDelete();
                $table->string('class_level', 100)->nullable()->after('class_level_id');
            });
        }

        // 7. Seed default class_levels if empty so existing production users can be migrated cleanly
        if (DB::table('class_levels')->count() === 0) {
            $now = now();
            DB::table('class_levels')->insert([
                [
                    'name' => 'Kelas 10 (X)',
                    'slug' => 'kelas-10',
                    'category' => 'SMA/MA/SMK',
                    'description' => 'Siswa tingkat awal SMA/MA/SMK sederajat',
                    'sort_order' => 1,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'name' => 'Kelas 11 (XI)',
                    'slug' => 'kelas-11',
                    'category' => 'SMA/MA/SMK',
                    'description' => 'Siswa tingkat menengah SMA/MA/SMK sederajat',
                    'sort_order' => 2,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'name' => 'Kelas 12 (XII)',
                    'slug' => 'kelas-12',
                    'category' => 'SMA/MA/SMK',
                    'description' => 'Siswa tingkat akhir SMA/MA/SMK persiapan UTBK-SNBT & Kedinasan',
                    'sort_order' => 3,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'name' => 'Alumni / Gap Year',
                    'slug' => 'alumni-gap-year',
                    'category' => 'Umum',
                    'description' => 'Lulusan SMA/MA/SMK yang mengikuti seleksi tahun berjalan',
                    'sort_order' => 4,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }

        // 8. Migrate existing users & user_profiles data into role-specific profile tables (Zero Data Loss)
        if (Schema::hasTable('users') && Schema::hasTable('user_profiles') && Schema::hasTable('roles') && Schema::hasTable('model_has_roles')) {
            $users = DB::table('users')->get();
            $profilesByUser = DB::table('user_profiles')->get()->keyBy('user_id');
            $rolesById = DB::table('roles')->pluck('name', 'id');
            $userRoleLinks = DB::table('model_has_roles')
                ->where('model_type', 'App\\Models\\User')
                ->get()
                ->groupBy('model_id');

            $now = now();

            foreach ($users as $u) {
                $legacy = $profilesByUser->get($u->id);
                $roleLinks = $userRoleLinks->get($u->id, collect());
                $roleNames = $roleLinks->map(fn ($r) => $rolesById[$r->role_id] ?? null)->filter()->values()->all();
                $primaryRole = $roleNames[0] ?? 'siswa';

                $phone = $legacy->phone ?? $u->phone ?? null;
                $gender = $legacy->gender ?? null;
                $birthYear = $legacy->birth_year ?? null;
                $address = $legacy->address ?? null;
                $socialMedia = $legacy->social_media ?? null;
                $bio = $legacy->bio ?? null;

                if ($primaryRole === 'admin') {
                    DB::table('admin_profiles')->updateOrInsert(
                        ['user_id' => $u->id],
                        [
                            'position' => 'Administrator Sistem',
                            'department' => 'Manajemen Pusat',
                            'phone' => $phone,
                            'bio' => $bio,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                } elseif ($primaryRole === 'admin_sekolah') {
                    DB::table('school_admin_profiles')->updateOrInsert(
                        ['user_id' => $u->id],
                        [
                            'position' => 'Koordinator Sekolah',
                            'nip' => null,
                            'phone' => $phone,
                            'gender' => $gender,
                            'address' => $address,
                            'bio' => $bio,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                } elseif ($primaryRole === 'tutor') {
                    DB::table('tutor_profiles')->updateOrInsert(
                        ['user_id' => $u->id],
                        [
                            'specialization' => 'Instruktur Utama',
                            'alma_mater' => $u->school ?? null,
                            'phone' => $phone,
                            'gender' => $gender,
                            'birth_year' => $birthYear,
                            'address' => $address,
                            'social_media' => $socialMedia,
                            'bio' => $bio,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                } else {
                    DB::table('student_profiles')->updateOrInsert(
                        ['user_id' => $u->id],
                        [
                            'class_level_id' => $legacy->class_level_id ?? null,
                            'class_level' => $legacy->class_level ?? null,
                            'phone' => $phone,
                            'gender' => $gender,
                            'birth_year' => $birthYear,
                            'target_campus' => null,
                            'address' => $address,
                            'social_media' => $socialMedia,
                            'bio' => $bio,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('user_profiles') && Schema::hasColumn('user_profiles', 'class_level_id')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->dropForeign(['class_level_id']);
                $table->dropColumn(['class_level_id', 'class_level']);
            });
        }

        Schema::dropIfExists('admin_profiles');
        Schema::dropIfExists('school_admin_profiles');
        Schema::dropIfExists('tutor_profiles');
        Schema::dropIfExists('student_profiles');
        Schema::dropIfExists('class_levels');
    }
};
