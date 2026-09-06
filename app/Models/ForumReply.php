<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ForumReply extends Model
{
    protected $fillable = [
        'forum_post_id',
        'user_id',
        'content',
        'is_tutor_answer',
    ];

    protected function casts(): array
    {
        return [
            'is_tutor_answer' => 'boolean',
        ];
    }

    public function post(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(ForumPost::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
