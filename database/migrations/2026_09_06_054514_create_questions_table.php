<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('subject')->nullable();
            $table->string('subtest')->nullable();
            $table->text('question_text');
            $table->string('question_image')->nullable();
            $table->text('explanation_text')->nullable();
            $table->integer('points')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('questions'); }
};