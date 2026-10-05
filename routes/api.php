<?php

use App\Http\Controllers\Api\Admin\AdminAuditLogController;
use App\Http\Controllers\Api\Admin\AdminCbtController;
use App\Http\Controllers\Api\Admin\AdminCbtImportController;
use App\Http\Controllers\Api\Admin\AdminCourseModuleController;
use App\Http\Controllers\Api\Admin\AdminElearningController;
use App\Http\Controllers\Api\Admin\AdminExamQuestionController;
use App\Http\Controllers\Api\Admin\AdminExamTypeController;
use App\Http\Controllers\Api\Admin\AdminModuleLessonController;
use App\Http\Controllers\Api\Admin\AdminReportController;
use App\Http\Controllers\Api\Admin\AdminRoleController;
use App\Http\Controllers\Api\Admin\AdminSchoolController;
use App\Http\Controllers\Api\Admin\FeatureController;
use App\Http\Controllers\Api\Admin\LandingHeroController;
use App\Http\Controllers\Api\Admin\LandingPromoController;
use App\Http\Controllers\Api\Admin\ProgramController;
use App\Http\Controllers\Api\Admin\RoleMenuController;
use App\Http\Controllers\Api\Admin\SchoolPackageController;
use App\Http\Controllers\Api\Admin\StatController;
use App\Http\Controllers\Api\Admin\TestimonialController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CbtController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ElearningController;
use App\Http\Controllers\Api\ForumController;
use App\Http\Controllers\Api\LandingController;
use App\Http\Controllers\Api\LearningPackageController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SchoolAdmin\SchoolProfileController;
use App\Http\Controllers\Api\SchoolAdmin\StudentController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\StudentElearningController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('landing', [LandingController::class, 'index']);
Route::get('programs/{slug}', [LandingController::class, 'programDetail']);
Route::get('learning-packages', [LearningPackageController::class, 'index']);
Route::get('elearning/courses', [ElearningController::class, 'courses']);
Route::get('elearning/catalog', [ElearningController::class, 'catalog']);
Route::get('elearning/courses/{slug}', [ElearningController::class, 'courseDetail']);
Route::get('courses/{course}/reviews', [ReviewController::class, 'courseReviews']);
Route::get('programs/{slug}/reviews', [ReviewController::class, 'programReviews']);
Route::get('schools/public', [AdminSchoolController::class, 'publicList']);

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

// Protected routes
// Public settings (no auth required)
Route::get('settings', [SettingsController::class, 'getPublicSettings']);

Route::middleware('auth:api')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    // Uploads
    Route::post('upload/document', [UploadController::class, 'uploadDocument']);
    Route::post('upload/avatar', [UploadController::class, 'uploadAvatar']);

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::post('student/programs/enroll', [DashboardController::class, 'enrollProgram']);

    // CBT
    Route::prefix('cbt')->group(function () {
        Route::get('sessions', [CbtController::class, 'sessions']);
        Route::get('available-exams', [CbtController::class, 'availableExams']);
        Route::get('exam-types', [CbtController::class, 'examTypes']);
        Route::post('sessions', [CbtController::class, 'startSession']);
        Route::post('sessions/{session}/answer', [CbtController::class, 'saveAnswer']);
        Route::post('sessions/{session}/submit', [CbtController::class, 'submit']);
        Route::post('sessions/{session}/cancel', [CbtController::class, 'cancel']);
    });

    // Forum
    Route::prefix('forum')->group(function () {
        Route::get('courses', [ForumController::class, 'courses']);
        Route::get('posts', [ForumController::class, 'index']);
        Route::post('posts', [ForumController::class, 'store']);
        Route::get('posts/{post}', [ForumController::class, 'show']);
        Route::post('posts/{post}/reply', [ForumController::class, 'reply']);
    });

    // Menus
    Route::get('my-menus', [RoleMenuController::class, 'myMenus']);

    // Student E-Learning
    Route::get('elearning/my-progress', [StudentElearningController::class, 'myProgress']);
    Route::get('elearning/streak-and-checkin', [StudentElearningController::class, 'streakAndCheckin']);
    Route::post('elearning/checkin', [StudentElearningController::class, 'storeCheckin']);
    Route::post('elearning/courses/{id}/enroll', [StudentElearningController::class, 'enroll']);
    Route::post('elearning/lessons/{id}/complete', [StudentElearningController::class, 'markComplete']);
    Route::get('elearning/courses/{id}/progress', [StudentElearningController::class, 'getProgress']);
    Route::post('elearning/lessons/{id}/quiz/submit', [StudentElearningController::class, 'submitQuiz']);
    Route::post('elearning/lessons/{id}/assignment/submit', [StudentElearningController::class, 'submitAssignment']);
    Route::get('elearning/lessons/{id}/assignment/history', [StudentElearningController::class, 'getAssignmentHistory']);

    // Student Reviews & Testimonials
    Route::post('courses/{course}/reviews', [ReviewController::class, 'storeCourseReview']);
    Route::post('programs/{slug}/reviews', [ReviewController::class, 'storeProgramReview']);

    // Admin Routes
    Route::prefix('admin')->group(function () {
        // Settings
        Route::put('settings', [SettingsController::class, 'updateSettings']);

        Route::get('roles/matrix', [RoleMenuController::class, 'index']);
        Route::post('roles/matrix/toggle', [RoleMenuController::class, 'toggle']);
        Route::apiResource('roles', AdminRoleController::class);
        Route::apiResource('users', UserController::class);
        Route::apiResource('programs', ProgramController::class);
        Route::apiResource('testimonials', TestimonialController::class);
        Route::apiResource('features', FeatureController::class);
        Route::apiResource('stats', StatController::class);
        Route::post('upload/thumbnail', [UploadController::class, 'uploadThumbnail']);
        Route::post('upload/document', [UploadController::class, 'uploadDocument']);

        // E-Learning Admin
        Route::apiResource('elearning/courses', AdminElearningController::class);
        Route::apiResource('elearning/courses.modules', AdminCourseModuleController::class);
        Route::apiResource('elearning/modules.lessons', AdminModuleLessonController::class);
        Route::get('elearning/modules/{module}/lessons/{lesson}/submissions', [AdminModuleLessonController::class, 'getAssignmentSubmissions']);
        Route::post('elearning/submissions/{submission}/review', [AdminModuleLessonController::class, 'reviewAssignmentSubmission']);
        Route::apiResource('cbt/exams', AdminCbtController::class);
        Route::apiResource('cbt/exams.questions', AdminExamQuestionController::class);
        Route::apiResource('cbt/exam-types', AdminExamTypeController::class);
        Route::post('cbt/exams/{exam}/import', [AdminCbtImportController::class, 'import']);
        Route::get('cbt/exams/{exam}/export', [AdminCbtImportController::class, 'export']);
        Route::get('cbt/template-excel', [AdminCbtImportController::class, 'downloadTemplate']);
        Route::get('cbt/exams/{exam}/active-sessions', [AdminCbtController::class, 'activeSessions']);

        Route::get('landing-hero', [LandingHeroController::class, 'show']);
        Route::put('landing-hero', [LandingHeroController::class, 'update']);

        Route::get('landing-promo', [LandingPromoController::class, 'show']);
        Route::put('landing-promo', [LandingPromoController::class, 'update']);

        // Learning Packages
        Route::get('learning-packages/courses', [App\Http\Controllers\Admin\LearningPackageController::class, 'getCourses']);
        Route::apiResource('learning-packages', App\Http\Controllers\Admin\LearningPackageController::class);

        // School Management
        Route::apiResource('schools', AdminSchoolController::class);
        Route::post('schools/{school}/admin', [AdminSchoolController::class, 'createAdmin']);
        Route::post('schools/{school}/students', [AdminSchoolController::class, 'createStudent']);
        Route::put('schools/{school}/students/{student}', [AdminSchoolController::class, 'updateStudent']);
        Route::delete('schools/{school}/students/{student}', [AdminSchoolController::class, 'deleteStudent']);
        Route::get('schools/{school}/students/export', [AdminSchoolController::class, 'exportStudents']);
        Route::get('schools/students/template', [AdminSchoolController::class, 'downloadStudentTemplate']);
        Route::post('schools/{school}/students/import', [AdminSchoolController::class, 'importStudents']);

        // School Packages & Contracts
        Route::get('schools/{school}/packages', [SchoolPackageController::class, 'index']);
        Route::post('schools/{school}/packages', [SchoolPackageController::class, 'store']);
        Route::post('schools/{school}/packages/{package}/renew', [SchoolPackageController::class, 'renew']);
        Route::get('schools/{school}/packages/{package}/history', [SchoolPackageController::class, 'history']);
        Route::delete('schools/{school}/packages/{package}', [SchoolPackageController::class, 'destroy']);

        // Audit Logs & Intelligence Reports (Decision Support)
        Route::get('audit-logs', [AdminAuditLogController::class, 'index']);
        Route::get('audit-logs/stats', [AdminAuditLogController::class, 'stats']);
        Route::get('audit-logs/{auditLog}', [AdminAuditLogController::class, 'show']);
        Route::get('reports/learning', [AdminReportController::class, 'learningReports']);
        Route::get('reports/exams', [AdminReportController::class, 'examReports']);
    });

    // School Admin Routes
    Route::prefix('school-admin')->group(function () {
        Route::get('profile', [SchoolProfileController::class, 'show']);
        Route::put('profile', [SchoolProfileController::class, 'update']);

        Route::get('students', [StudentController::class, 'index']);
        Route::post('students', [StudentController::class, 'store']);
        Route::post('students/batch', [StudentController::class, 'batchStore']);
        Route::get('students/export', [StudentController::class, 'export']);
        Route::get('students/template', [StudentController::class, 'downloadTemplate']);
        Route::post('students/import', [StudentController::class, 'import']);
        Route::get('students/{student}', [StudentController::class, 'show']);
        Route::put('students/{student}', [StudentController::class, 'update']);
        Route::delete('students/{student}', [StudentController::class, 'destroy']);

        // School Packages & Contracts (for school admin to view)
        Route::get('packages', [SchoolPackageController::class, 'mySchoolPackages']);
    });
});
