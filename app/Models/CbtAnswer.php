<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CbtAnswer extends Model
{
    protected $fillable = [
        'cbt_session_id',
        'question_number',
        'selected_option',
        'is_flagged',
    ];

    protected function casts(): array
    {
        return [
            'is_flagged' => 'boolean',
        ];
    }

    public function session(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(CbtSession::class);
    }
}
