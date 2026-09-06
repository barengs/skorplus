<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Http\Request;

class AdminCbtController extends Controller
{
    public function index()
    {
        return response()->json(Exam::withCount('questions')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $exam = Exam::create($validated);
        $exam->total_questions = 0; // default total_questions
        return response()->json($exam, 201);
    }

    public function show($id)
    {
        return response()->json(Exam::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'duration_minutes' => 'sometimes|required|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $exam->update($validated);
        
        $exam = Exam::withCount('questions')->find($id);
        
        return response()->json($exam);
    }

    public function destroy($id)
    {
        Exam::destroy($id);
        return response()->json(null, 204);
    }
}
