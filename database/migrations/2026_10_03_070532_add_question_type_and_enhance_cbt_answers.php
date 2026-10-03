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
        Schema::table('questions', function (Blueprint $table) {
            $table->string('question_type', 30)->default('single_choice')->after('subtest');
        });

        Schema::table('cbt_answers', function (Blueprint $table) {
            $table->text('selected_option')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cbt_answers', function (Blueprint $table) {
            $table->string('selected_option', 1)->nullable()->change();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('question_type');
        });
    }
};
