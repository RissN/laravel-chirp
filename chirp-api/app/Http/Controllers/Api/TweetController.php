<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTweetRequest;
use App\Http\Resources\TweetResource;
use App\Models\Tweet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TweetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get following IDs
        $followingIds = $user->following()->pluck('users.id');
        // Include their own tweets
        $followingIds->push($user->id);

        $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
            ->whereIn('user_id', $followingIds)
            ->whereIn('tweet_type', ['tweet', 'retweet', 'quote'])
            ->latest()
            ->paginate(20);

        return TweetResource::collection($tweets)->additional([
            'success' => true,
            'message' => 'Timeline retrieved successfully',
        ]);
    }

    public function explore(Request $request)
    {
        $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
            ->whereIn('tweet_type', ['tweet', 'quote'])
            ->orderByDesc('likes_count')
            ->orderByDesc('views_count')
            ->latest()
            ->paginate(20);

        return TweetResource::collection($tweets)->additional([
            'success' => true,
            'message' => 'Explore timeline retrieved successfully',
        ]);
    }

    public function store(StoreTweetRequest $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $tweet = Tweet::query()->create([
            'user_id' => $user->id,
            'content' => $request->input('content'),
            'media' => $request->input('media'),
            'tweet_type' => 'tweet',
        ]);

        \App\Models\User::where('id', $user->id)->increment('tweets_count');

        $tweet->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Tweet created successfully',
            'data' => new TweetResource($tweet)
        ], 201);
    }

    public function show(Tweet $tweet)
    {
        $tweet->increment('views_count');
        
        $tweet->load(['user', 'parent.user', 'originalTweet.user']);

        return response()->json([
            'success' => true,
            'message' => 'Tweet retrieved successfully',
            'data' => new TweetResource($tweet)
        ]);
    }

    public function destroy(Request $request, Tweet $tweet)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($tweet->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action'
            ], 403);
        }

        // Delete associated media files from storage
        if ($tweet->media && is_array($tweet->media)) {
            foreach ($tweet->media as $mediaUrl) {
                // Extract relative path after /storage/
                $path = Str::after($mediaUrl, '/storage/');
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        $tweet->delete();
        \App\Models\User::where('id', $user->id)->decrement('tweets_count');

        return response()->json([
            'success' => true,
            'message' => 'Tweet deleted successfully'
        ]);
    }
}
