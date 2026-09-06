<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nisn', 20)->nullable()->unique()->after('email');
            $table->string('phone', 20)->nullable()->after('nisn');
            $table->string('school')->nullable()->after('phone');
            $table->string('program')->nullable()->after('school'); // mandiri, intensif, garansi
            $table->string('avatar')->nullable()->after('program');
            $table->boolean('is_active')->default(true)->after('avatar');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nisn', 'phone', 'school', 'program', 'avatar', 'is_active']);
        });
    }
};
