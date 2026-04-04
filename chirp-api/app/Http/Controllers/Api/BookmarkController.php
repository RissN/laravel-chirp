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
            ->whereHas('bookmarks', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->latest('bookmarks.created_at')
            ->paginate(20);

        return TweetResource::collection($tweets)->additional([
            'success' => true
        ]);
    }
}
