<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiasecResult extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['career_recommendations' => 'array', 'major_recommendations' => 'array'];
    public function user() { return $this->belongsTo('App\Models\User'); }
}