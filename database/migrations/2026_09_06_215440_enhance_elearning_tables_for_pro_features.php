<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->decimal('rating', 3, 1)->default(0.0)->after('thumbnail');
            $table->integer('total_reviews')->default(0)->after('rating');
            $table->boolean('has_certificate')->default(false)->after('total_reviews');
            $table->foreignId('instructor_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->string('type')->default('video')->after('title'); // video, reading, quiz, assignment
            $table->longText('content')->nullable()->after('summary'); // for reading materials
            $table->boolean('is_preview')->default(false)->after('content'); // can watch without login/enroll
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['instructor_id']);
            $table->dropColumn(['instructor_id', 'rating', 'total_reviews', 'has_certificate']);
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['type', 'content', 'is_preview']);
        });
    }
};
