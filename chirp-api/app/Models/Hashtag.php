<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Hashtag extends Model
{
    protected $fillable = [
        'name',
        'tweets_count',
    ];

    public function tweets(): BelongsToMany
    {
        return $this->belongsToMany(Tweet::class);
    }
}
