<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\TweetResource;
use App\Models\User;
use App\Models\Tweet;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function show($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        
        return response()->json([
            'success' => true,
            'data' => new UserResource($user)
        ]);
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => new UserResource($user)
        ]);
    }

    public function tweets($username)
    {
        $user = User::where('username', $username)->firstOrFail();

        $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
            ->where('user_id', $user->id)
            ->whereIn('tweet_type', ['tweet', 'retweet', 'quote'])
            ->latest()
            ->paginate(20);

        return TweetResource::collection($tweets)->additional([
            'success' => true
        ]);
    }

    public function media($username)
    {
        $user = User::where('username', $username)->firstOrFail();

        $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
            ->where('user_id', $user->id)
            ->whereNotNull('media')
            ->latest()
            ->paginate(20);

        return TweetResource::collection($tweets)->additional([
            'success' => true
        ]);
    }

    public function likes($username)
    {
        $user = User::where('username', $username)->firstOrFail();

        // Get tweets liked by user via intersection with likes table
        $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
            ->whereHas('likes', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->latest()
            ->paginate(20);

        return TweetResource::collection($tweets)->additional([
            'success' => true
        ]);
    }
}
