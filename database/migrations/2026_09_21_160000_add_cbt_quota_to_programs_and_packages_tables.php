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
        if (Schema::hasTable('programs') && ! Schema::hasColumn('programs', 'cbt_quota')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->unsignedInteger('cbt_quota')->nullable()->after('price_period')->comment('Batas jumlah ujian CBT, null = tak terbatas');
            });
        }

        if (Schema::hasTable('learning_packages') && ! Schema::hasColumn('learning_packages', 'cbt_quota')) {
            Schema::table('learning_packages', function (Blueprint $table) {
                $table->unsignedInteger('cbt_quota')->nullable()->after('discount_price')->comment('Batas jumlah ujian CBT, null = tak terbatas');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('programs') && Schema::hasColumn('programs', 'cbt_quota')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->dropColumn('cbt_quota');
            });
        }

        if (Schema::hasTable('learning_packages') && Schema::hasColumn('learning_packages', 'cbt_quota')) {
            Schema::table('learning_packages', function (Blueprint $table) {
                $table->dropColumn('cbt_quota');
            });
        }
    }
};
