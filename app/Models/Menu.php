<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class Menu extends Model {
    protected $guarded = ['id'];
    public function roles() {
        return $this->belongsToMany(Role::class);
    }
}
