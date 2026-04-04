<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tweet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'content',
        'media',
        'tweet_type',
        'parent_id',
        'retweet_id',
        'likes_count',
        'replies_count',
        'retweets_count',
        'bookmarks_count',
        'views_count',
    ];

    protected $casts = [
        'media' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Tweet::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Tweet::class, 'parent_id');
    }

    public function originalTweet(): BelongsTo
    {
        return $this->belongsTo(Tweet::class, 'retweet_id');
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'likes')->withTimestamps();
    }

    public function retweets(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'retweets')->withTimestamps();
    }

    public function hashtags(): BelongsToMany
    {
        return $this->belongsToMany(Hashtag::class);
    }
}
