<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * Dilempar ketika proses generate kursus dari dokumen gagal
 * (konfigurasi tidak lengkap, dokumen tidak terbaca, atau respons AI tidak valid).
 */
class AiCourseGenerationException extends RuntimeException {}
