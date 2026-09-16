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
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('attachment_doc')->nullable()->after('attachment_pdf');
            $table->string('attachment_name')->nullable()->after('attachment_doc');
        });

        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->string('file_url');
            $table->string('filename');
            $table->text('notes')->nullable();
            $table->string('status')->default('submitted'); // submitted, revision_needed, approved
            $table->text('feedback')->nullable(); // instructor's rejection or review feedback
            $table->integer('grade')->nullable();
            $table->integer('version')->default(1);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'lesson_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['attachment_doc', 'attachment_name']);
        });
    }
};
