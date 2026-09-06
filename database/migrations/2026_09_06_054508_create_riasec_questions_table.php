<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('riasec_questions', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->enum('dimension', ['R', 'I', 'A', 'S', 'E', 'C']);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('riasec_questions'); }
};