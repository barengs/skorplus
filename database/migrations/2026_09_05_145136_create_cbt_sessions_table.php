<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cbt_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('exam_type'); // tps, tkpa, skolastik, etc
            $table->string('exam_title');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedSmallInteger('score')->nullable();
            $table->unsignedInteger('duration_seconds')->default(5400); // 90 min default
            $table->string('status')->default('ongoing'); // ongoing, submitted, expired
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cbt_sessions');
    }
};
