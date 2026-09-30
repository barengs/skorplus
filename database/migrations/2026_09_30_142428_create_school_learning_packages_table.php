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
        Schema::create('school_learning_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('learning_package_id')->constrained()->cascadeOnDelete();
            $table->string('current_contract_number')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('max_students')->nullable(); // null means unlimited
            $table->enum('status', ['active', 'expired', 'suspended'])->default('active');
            $table->timestamps();

            // Prevent assigning same package multiple times concurrently
            $table->unique(['school_id', 'learning_package_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_learning_packages');
    }
};
