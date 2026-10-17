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
        Schema::table('cbt_sessions', function (Blueprint $table) {
            $table->unsignedSmallInteger('violation_count')->default(0)->after('status');
            $table->timestamp('last_violation_at')->nullable()->after('violation_count');
            $table->boolean('is_violation_submitted')->default(false)->after('last_violation_at');
            $table->json('violation_logs')->nullable()->after('is_violation_submitted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cbt_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'violation_count',
                'last_violation_at',
                'is_violation_submitted',
                'violation_logs',
            ]);
        });
    }
};
