<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->after('instructor_id')->constrained('programs')->nullOnDelete();
            $table->string('program_name')->nullable()->after('program_id');
            $table->string('instructor_name')->nullable()->after('instructor_id');
            $table->boolean('is_popular')->default(false)->after('has_certificate');
            $table->boolean('is_bestseller')->default(false)->after('is_popular');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['program_id']);
            $table->dropColumn(['program_id', 'program_name', 'instructor_name', 'is_popular', 'is_bestseller']);
        });
    }
};
