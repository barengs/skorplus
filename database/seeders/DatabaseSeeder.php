<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            MenuSeeder::class,
            SchoolSeeder::class,
            LandingPageSeeder::class,
            CourseModuleLessonSeeder::class,
            CourseCatalogSeeder::class,
            ExamSeeder::class,
            AuditLogSeeder::class,
        ]);
    }
}
