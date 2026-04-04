<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tweet;
use App\Models\Hashtag;
use App\Http\Resources\UserResource;
use App\Http\Resources\TweetResource;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function searchAll(Request $request)
    {
        $q = $request->query('q');
        $type = $request->query('type', 'all'); // all, users, tweets

        if (!$q) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $data = [];

        if ($type === 'all' || $type === 'users') {
            $users = User::where('name', 'LIKE', "%{$q}%")
                ->orWhere('username', 'LIKE', "%{$q}%")
                ->limit(5)
                ->get();
            $data['users'] = UserResource::collection($users);
        }

        if ($type === 'all' || $type === 'tweets') {
            $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
                ->where('content', 'LIKE', "%{$q}%")
                ->limit(15)
                ->latest()
                ->get();
            $data['tweets'] = TweetResource::collection($tweets);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function trending()
    {
        // For simplicity, trending hashtags based on tweets count
        $hashtags = Hashtag::orderByDesc('tweets_count')->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => $hashtags
        ]);
    }

    // specific method for user controller
    public function search(Request $request)
    {
        $q = $request->query('q');
        
        $users = User::where('name', 'LIKE', "%{$q}%")
            ->orWhere('username', 'LIKE', "%{$q}%")
            ->paginate(20);

        return UserResource::collection($users)->additional([
            'success' => true
        ]);
    }
}
