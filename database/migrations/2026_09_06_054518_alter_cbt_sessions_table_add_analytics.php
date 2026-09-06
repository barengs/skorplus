<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('cbt_sessions', function (Blueprint $table) {
            $table->foreignId('exam_id')->nullable()->after('user_id')->constrained()->onDelete('cascade');
            $table->integer('total_score')->default(0)->after('status');
            $table->json('subtest_scores')->nullable()->after('total_score');
            $table->json('strengths')->nullable()->after('subtest_scores');
            $table->json('weaknesses')->nullable()->after('strengths');
            $table->integer('predicted_score')->nullable()->after('weaknesses');
        });
    }
    public function down(): void {
        Schema::table('cbt_sessions', function (Blueprint $table) {
            $table->dropForeign(['exam_id']);
            $table->dropColumn(['exam_id', 'total_score', 'subtest_scores', 'strengths', 'weaknesses', 'predicted_score']);
        });
    }
};