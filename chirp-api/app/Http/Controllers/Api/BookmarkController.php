<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tweet;
use App\Http\Resources\TweetResource;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
            ->join('bookmarks', 'tweets.id', '=', 'bookmarks.tweet_id')
            ->where('bookmarks.user_id', $user->id)
            ->select('tweets.*')
            ->orderByDesc('bookmarks.created_at')
            ->paginate(20);

        return TweetResource::collection($tweets)->additional([
            'success' => true
        ]);
    }
}
