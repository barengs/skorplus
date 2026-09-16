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
        Schema::table('lessons', function (Blueprint $table) {
            $table->json('quiz_questions')->nullable()->after('content');
            $table->integer('min_pass_score')->default(60)->after('quiz_questions');
        });

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->integer('score_percentage')->nullable()->after('is_completed');
            $table->json('quiz_attempt_data')->nullable()->after('score_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['quiz_questions', 'min_pass_score']);
        });

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropColumn(['score_percentage', 'quiz_attempt_data']);
        });
    }
};
