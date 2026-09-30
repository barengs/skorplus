<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LearningPackage;
use App\Models\School;
use App\Models\SchoolContractRenewal;
use App\Models\SchoolLearningPackage;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolPackageController extends Controller
{
    // List packages assigned to a school (Admin)
    public function index($schoolId): JsonResponse
    {
        $school = School::withCount(['students'])->findOrFail($schoolId);

        $packages = SchoolLearningPackage::with(['learningPackage.courses', 'renewals.renewedBy'])
            ->where('school_id', $schoolId)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($p) use ($school) {
                /** @var SchoolLearningPackage $p */
                // Update status if expired
                if ($p->end_date && Carbon::parse($p->end_date)->isPast() && $p->status === 'active') {
                    $p->update(['status' => 'expired']);
                }

                $diff = $p->end_date ? (int) now()->startOfDay()->diffInDays(Carbon::parse($p->end_date)->startOfDay(), false) : 0;

                return [
                    'id' => $p->id,
                    'learning_package_id' => $p->learning_package_id,
                    'package_name' => $p->learningPackage?->name,
                    'package_description' => $p->learningPackage?->description,
                    'thumbnail' => $p->learningPackage?->thumbnail,
                    'features' => $p->learningPackage?->features ?? [],
                    'courses_count' => $p->learningPackage?->courses?->count() ?? 0,
                    'courses' => $p->learningPackage?->courses?->map(fn ($c) => [
                        'id' => $c->id,
                        'title' => $c->title,
                        'category' => $c->category,
                        'thumbnail' => $c->thumbnail,
                    ]) ?? [],
                    'current_contract_number' => $p->current_contract_number,
                    'start_date' => $p->start_date ? Carbon::parse($p->start_date)->format('Y-m-d') : null,
                    'end_date' => $p->end_date ? Carbon::parse($p->end_date)->format('Y-m-d') : null,
                    'max_students' => $p->max_students,
                    'current_students_count' => $school->students_count,
                    'status' => $p->status,
                    'days_remaining' => $diff,
                    'is_expired' => $diff < 0,
                    'renewals_count' => $p->renewals->count(),
                    'latest_renewal' => $p->renewals->first(),
                ];
            });

        // Also fetch all available packages for dropdown
        $availablePackages = LearningPackage::where('is_published', true)
            ->select('id', 'name', 'price', 'discount_price', 'thumbnail', 'description')
            ->get();

        return response()->json([
            'school' => [
                'id' => $school->id,
                'name' => $school->name,
                'email' => $school->email,
                'phone' => $school->phone,
                'students_count' => $school->students_count,
            ],
            'packages' => $packages,
            'available_packages' => $availablePackages,
            'total_students' => $school->students_count,
        ]);
    }

    // Assign a new package to school
    public function store(Request $request, $schoolId): JsonResponse
    {
        $school = School::findOrFail($schoolId);

        $validated = $request->validate([
            'learning_package_id' => 'required|exists:learning_packages,id',
            'contract_number' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'max_students' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        // Check if already assigned
        $existing = SchoolLearningPackage::where('school_id', $schoolId)
            ->where('learning_package_id', $validated['learning_package_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Paket ini sudah ditetapkan ke sekolah ini. Silakan gunakan fitur Perpanjang Kontrak jika ingin memperbarui kontrak.',
            ], 422);
        }

        $package = SchoolLearningPackage::create([
            'school_id' => $schoolId,
            'learning_package_id' => $validated['learning_package_id'],
            'current_contract_number' => $validated['contract_number'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'max_students' => $validated['max_students'] ?? null,
            'status' => 'active',
        ]);

        // Create initial renewal record
        SchoolContractRenewal::create([
            'school_learning_package_id' => $package->id,
            'contract_number' => $validated['contract_number'],
            'renewal_type' => 'initial',
            'previous_end_date' => null,
            'new_end_date' => $validated['end_date'],
            'quota_students' => $validated['max_students'] ?? null,
            'renewed_by' => $request->user()?->id,
            'renewal_date' => now()->toDateString(),
            'notes' => $validated['notes'] ?? 'Penetapan kontrak awal paket pembelajaran.',
        ]);

        AuditLog::record(
            action: 'ASSIGN_PACKAGE',
            description: "Menetapkan paket {$package->learningPackage?->name} ke sekolah {$school->name} (No Kontrak: {$validated['contract_number']})",
            module: 'sekolah',
            entity: $package
        );

        return response()->json([
            'message' => 'Paket berhasil ditetapkan ke sekolah!',
            'package' => $package->load('learningPackage'),
        ], 201);
    }

    // Renew contract for a package
    public function renew(Request $request, $schoolId, $packageId): JsonResponse
    {
        $school = School::findOrFail($schoolId);
        $package = SchoolLearningPackage::where('school_id', $schoolId)
            ->where('id', $packageId)
            ->firstOrFail();

        $validated = $request->validate([
            'contract_number' => 'required|string|max:100',
            'renewal_type' => 'required|in:renewal,upgrade_quota',
            'new_end_date' => 'required|date',
            'quota_students' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $previousEndDate = $package->end_date;

        // Update package
        $package->update([
            'current_contract_number' => $validated['contract_number'],
            'end_date' => $validated['new_end_date'],
            'max_students' => $validated['quota_students'] ?? $package->max_students,
            'status' => 'active', // Reactivate if it was expired
        ]);

        // Create history log
        $renewal = SchoolContractRenewal::create([
            'school_learning_package_id' => $package->id,
            'contract_number' => $validated['contract_number'],
            'renewal_type' => $validated['renewal_type'],
            'previous_end_date' => $previousEndDate,
            'new_end_date' => $validated['new_end_date'],
            'quota_students' => $validated['quota_students'] ?? $package->max_students,
            'renewed_by' => $request->user()?->id,
            'renewal_date' => now()->toDateString(),
            'notes' => $validated['notes'] ?? null,
        ]);

        AuditLog::record(
            action: 'RENEW_CONTRACT',
            description: "Memperpanjang kontrak paket {$package->learningPackage?->name} sekolah {$school->name} s/d {$validated['new_end_date']} (No: {$validated['contract_number']})",
            module: 'sekolah',
            entity: $package
        );

        return response()->json([
            'message' => 'Kontrak paket berhasil diperpanjang!',
            'package' => $package->load(['learningPackage', 'renewals.renewedBy']),
        ]);
    }

    // History of renewals
    public function history($schoolId, $packageId): JsonResponse
    {
        $package = SchoolLearningPackage::where('school_id', $schoolId)
            ->where('id', $packageId)
            ->with(['learningPackage', 'renewals.renewedBy', 'school'])
            ->firstOrFail();

        return response()->json([
            'package' => $package,
            'renewals' => $package->renewals,
        ]);
    }

    // Remove or suspend package
    public function destroy($schoolId, $packageId): JsonResponse
    {
        $package = SchoolLearningPackage::where('school_id', $schoolId)
            ->where('id', $packageId)
            ->firstOrFail();

        $packageName = $package->learningPackage?->name;
        $school = $package->school;

        $package->delete();

        AuditLog::record(
            action: 'REMOVE_PACKAGE',
            description: "Mencabut paket {$packageName} dari sekolah {$school?->name}",
            module: 'sekolah'
        );

        return response()->json([
            'message' => 'Paket berhasil dicabut dari sekolah.',
        ]);
    }

    // Endpoint for School Admin to view their school's packages & contract
    public function mySchoolPackages(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->school_id) {
            return response()->json(['message' => 'Anda tidak terhubung dengan sekolah mana pun.'], 403);
        }

        return $this->index($user->school_id);
    }
}
