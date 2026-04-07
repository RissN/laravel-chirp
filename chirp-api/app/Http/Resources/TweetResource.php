<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class TweetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user('sanctum');

        return [
            'id' => $this->id,
            'content' => $this->content,
            'media' => $this->media,
            'tweet_type' => $this->tweet_type,
            'likes_count' => $this->likes_count,
            'replies_count' => $this->replies_count,
            'retweets_count' => $this->retweets_count,
            'bookmarks_count' => $this->bookmarks_count,
            'views_count' => $this->views_count,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'user' => new UserResource($this->whenLoaded('user')),
            'parent' => new TweetResource($this->whenLoaded('parent')),
            'original_tweet' => new TweetResource($this->whenLoaded('originalTweet')),
            
            // Interaction booleans specific to auth user
            'is_liked' => $user && DB::table('likes')
                ->where('user_id', $user->id)
                ->where('tweet_id', $this->id)
                ->exists(),
            'is_retweeted' => $user && DB::table('retweets')
                ->where('user_id', $user->id)
                ->where('tweet_id', $this->id)
                ->exists(),
            'is_bookmarked' => $user && DB::table('bookmarks')
                ->where('user_id', $user->id)
                ->where('tweet_id', $this->id)
                ->exists(),
        ];
    }
}
