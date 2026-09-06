<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cbt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_session_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('question_number');
            $table->string('selected_option', 1)->nullable(); // A, B, C, D, E
            $table->boolean('is_flagged')->default(false);
            $table->timestamps();

            $table->unique(['cbt_session_id', 'question_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cbt_answers');
    }
};
