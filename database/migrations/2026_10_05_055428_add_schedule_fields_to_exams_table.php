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
            $table->string('schedule_type')->default('always')->after('is_active');
            $table->dateTime('start_time')->nullable()->after('schedule_type');
            $table->dateTime('end_time')->nullable()->after('start_time');
            $table->string('start_hour', 10)->nullable()->after('end_time');
            $table->string('end_hour', 10)->nullable()->after('start_hour');
            $table->json('scheduled_days')->nullable()->after('end_hour');
            $table->unsignedSmallInteger('interval_hours')->nullable()->after('scheduled_days');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn([
                'schedule_type',
                'start_time',
                'end_time',
                'start_hour',
                'end_hour',
                'scheduled_days',
                'interval_hours',
            ]);
        });
    }
};
