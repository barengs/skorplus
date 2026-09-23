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
        Schema::table('exams', function (Blueprint $table) {
            $table->foreignId('exam_type_id')->nullable()->after('title')->constrained('exam_types')->nullOnDelete();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('exam_type_id')->nullable()->after('id')->constrained('exam_types')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['exam_type_id']);
            $table->dropColumn('exam_type_id');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropForeign(['exam_type_id']);
            $table->dropColumn('exam_type_id');
        });
    }
};
