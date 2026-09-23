<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exports\ExamQuestionsExport;
use App\Exports\ExamQuestionsTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\ExamQuestionsImport;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminCbtImportController extends Controller
{
    /**
     * Download CBT questions Excel template.
     */
    public function downloadTemplate(): BinaryFileResponse
    {
        return Excel::download(new ExamQuestionsTemplateExport, 'template-import-soal-cbt.xlsx');
    }

    /**
     * Export questions to Excel file.
     */
    public function export($examId): BinaryFileResponse
    {
        $exam = Exam::findOrFail($examId);

        return Excel::download(new ExamQuestionsExport($exam), 'soal-'.$exam->title.'-'.date('Y-m-d').'.xlsx');
    }

    /**
     * Import questions from Excel file.
     */
    public function import(Request $request, $examId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $exam = Exam::findOrFail($examId);

        try {
            $import = new ExamQuestionsImport($exam);

            Excel::import($import, $request->file('file'));

            if ($import->getErrors()) {
                return response()->json([
                    'message' => 'Import selesai dengan beberapa kesalahan',
                    'imported' => $import->getImportedCount(),
                    'errors' => $import->getErrors(),
                ], 422);
            }

            // Update exam total questions
            $exam->update(['total_questions' => $exam->questions()->count()]);

            return response()->json([
                'message' => 'Soal berhasil diimport!',
                'imported' => $import->getImportedCount(),
                'exam' => $exam->loadCount('questions'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengimport soal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
