<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('riasec_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('r_score')->default(0);
            $table->integer('i_score')->default(0);
            $table->integer('a_score')->default(0);
            $table->integer('s_score')->default(0);
            $table->integer('e_score')->default(0);
            $table->integer('c_score')->default(0);
            $table->string('primary_type')->nullable();
            $table->string('secondary_type')->nullable();
            $table->json('career_recommendations')->nullable();
            $table->json('major_recommendations')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('riasec_results'); }
};