<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Delete all users that do not have any roles assigned.
        // This cleans up dangling users created before DB::transaction was implemented
        // when role assignment failed due to guard mismatch.
        User::doesntHave('roles')->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
