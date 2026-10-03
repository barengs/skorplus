<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Order of seeders is carefully orchestrated to resolve dependencies cleanly.
     */
    public function run(): void
    {
        $this->call([
            // 1. Roles, Permissions & Core Demo Users
            RolePermissionSeeder::class,

            // 2. Navigation Menu & Access Matrix (depends on roles)
            MenuSeeder::class,

            // 3. Programs, Landing Page Content & Testimonials
            LandingPageSeeder::class,

            // 4. Core SMA Courses, Modules, Lessons & Learning Packages
            CourseModuleLessonSeeder::class,

            // 5. Complete SMA / UTBK 2027 Course Catalog & Syllabi (depends on programs & courses)
            CourseCatalogSeeder::class,

            // 6. Jawa Timur Partner High Schools & School Admin/Student Links (depends on learning packages & users)
            SchoolSeeder::class,

            // 7. Official SNBT 2027 Subtest Types (PU, PPU, PBM, PK, LBI, LBE, PM, TPS)
            ExamTypeSeeder::class,

            // 8. CBT Exams & Questions: Single Choice, Multiple Choice & Short Answer (depends on exam types)
            ExamSeeder::class,

            // 9. Student Reviews for SMA Courses & Programs (depends on users, courses & programs)
            StudentReviewSeeder::class,

            // 10. Audit Log Activity Trail (depends on users, schools, courses & exams)
            AuditLogSeeder::class,
        ]);
    }
}
