<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CbtController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ForumController;
use App\Http\Controllers\Api\LandingController;
use App\Http\Controllers\Api\RiasecController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\ProgramController;
use App\Http\Controllers\Api\Admin\TestimonialController;
use App\Http\Controllers\Api\Admin\FeatureController;
use App\Http\Controllers\Api\Admin\StatController;
use App\Http\Controllers\Api\Admin\LandingHeroController;
use App\Http\Controllers\Api\Admin\LandingPromoController;
use App\Http\Controllers\Api\Admin\AdminElearningController;
use App\Http\Controllers\Api\Admin\AdminCbtController;
use App\Http\Controllers\Api\Admin\AdminExamQuestionController;
use App\Http\Controllers\Api\Admin\AdminRoleController;
use App\Http\Controllers\Api\Admin\AdminCourseModuleController;
use App\Http\Controllers\Api\Admin\AdminModuleLessonController;
use App\Http\Controllers\Api\ElearningController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Admin\RoleMenuController;

// Public routes
Route::get('landing', [LandingController::class, 'index']);
Route::get('elearning/courses', [ElearningController::class, 'courses']);
Route::get('elearning/courses/{slug}', [ElearningController::class, 'courseDetail']);

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index']);

    // E-Learning
    Route::post('elearning/lessons/{lesson}/complete', [ElearningController::class, 'markComplete']);

    // Riasec
    Route::prefix('riasec')->group(function () {
        Route::get('questions', [RiasecController::class, 'questions']);
        Route::post('submit', [RiasecController::class, 'submit']);
        Route::get('result', [RiasecController::class, 'result']);
    });

    // CBT
    Route::prefix('cbt')->group(function () {
        Route::get('sessions', [CbtController::class, 'sessions']);
        Route::post('sessions', [CbtController::class, 'startSession']);
        Route::post('sessions/{session}/answer', [CbtController::class, 'saveAnswer']);
        Route::post('sessions/{session}/submit', [CbtController::class, 'submit']);
    });

    // Forum
    Route::prefix('forum')->group(function () {
        Route::get('posts', [ForumController::class, 'index']);
        Route::post('posts', [ForumController::class, 'store']);
        Route::get('posts/{post}', [ForumController::class, 'show']);
        Route::post('posts/{post}/reply', [ForumController::class, 'reply']);
    });

    // Menus
    Route::get('my-menus', [RoleMenuController::class, 'myMenus']);

    // Admin Landing Page Management
    Route::prefix('admin')->group(function () {
        Route::get('roles/matrix', [RoleMenuController::class, 'index']);
        Route::post('roles/matrix/toggle', [RoleMenuController::class, 'toggle']);
        Route::apiResource('roles', AdminRoleController::class);
        Route::apiResource('users', UserController::class);
        Route::apiResource('programs', ProgramController::class);
        Route::apiResource('testimonials', TestimonialController::class);
        Route::apiResource('features', FeatureController::class);
        Route::apiResource('stats', StatController::class);
        Route::post('upload/thumbnail', [App\Http\Controllers\Api\UploadController::class, 'uploadThumbnail']);
        
        // E-Learning
        Route::apiResource('elearning/courses', AdminElearningController::class);
        Route::apiResource('elearning/courses.modules', AdminCourseModuleController::class);
        Route::apiResource('elearning/modules.lessons', AdminModuleLessonController::class);
        Route::apiResource('cbt/exams', AdminCbtController::class);
        Route::apiResource('cbt/exams.questions', AdminExamQuestionController::class);

        Route::get('landing-hero', [LandingHeroController::class, 'show']);
        Route::put('landing-hero', [LandingHeroController::class, 'update']);

        Route::get('landing-promo', [LandingPromoController::class, 'show']);
        Route::put('landing-promo', [LandingPromoController::class, 'update']);
    });
});
