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
        Schema::create('school_contract_renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_learning_package_id')->constrained('school_learning_packages')->cascadeOnDelete();
            $table->string('contract_number');
            $table->enum('renewal_type', ['initial', 'renewal', 'upgrade_quota'])->default('renewal');
            $table->date('previous_end_date')->nullable();
            $table->date('new_end_date');
            $table->integer('quota_students')->nullable();
            $table->foreignId('renewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('renewal_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_contract_renewals');
    }
};
