<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTweetRequest;
use App\Http\Resources\TweetResource;
use App\Models\Tweet;
use App\Models\Like;
use App\Models\Retweet;
use App\Models\Bookmark;
use Illuminate\Http\Request;

class TweetActionController extends Controller
{
    public function like(Request $request, Tweet $tweet)
    {
        $user = $request->user();
        $like = Like::where('user_id', $user->id)->where('tweet_id', $tweet->id)->first();

        if ($like) {
            $like->delete();
            $tweet->decrement('likes_count');
            $message = 'Tweet unliked';
        } else {
            Like::create(['user_id' => $user->id, 'tweet_id' => $tweet->id]);
            $tweet->increment('likes_count');
            
            if ($tweet->user_id !== $user->id) {
                $notification = \App\Models\Notification::create([
                    'user_id' => $tweet->user_id,
                    'actor_id' => $user->id,
                    'type' => 'like',
                    'notifiable_type' => get_class($tweet),
                    'notifiable_id' => $tweet->id,
                ]);
                event(new \App\Events\NotificationCreated($notification));
            }
            
            $message = 'Tweet liked';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'is_liked' => !$like,
                'likes_count' => $tweet->likes_count
            ]
        ]);
    }

    public function retweet(Request $request, Tweet $tweet)
    {
        $user = $request->user();
        $retweet = Retweet::where('user_id', $user->id)->where('tweet_id', $tweet->id)->first();

        if ($retweet) {
            $retweet->delete();
            // Also delete the actual retweet record if we created one
            Tweet::where('user_id', $user->id)->where('retweet_id', $tweet->id)->delete();
            $tweet->decrement('retweets_count');
            $request->user()->decrement('tweets_count');
            $message = 'Retweet removed';
        } else {
            Retweet::create(['user_id' => $user->id, 'tweet_id' => $tweet->id]);
            Tweet::create([
                'user_id' => $user->id,
                'tweet_type' => 'retweet',
                'retweet_id' => $tweet->id
            ]);
            $tweet->increment('retweets_count');
            $request->user()->increment('tweets_count');
            
            if ($tweet->user_id !== $user->id) {
                $notification = \App\Models\Notification::create([
                    'user_id' => $tweet->user_id,
                    'actor_id' => $user->id,
                    'type' => 'retweet',
                    'notifiable_type' => get_class($tweet),
                    'notifiable_id' => $tweet->id,
                ]);
                event(new \App\Events\NotificationCreated($notification));
            }
            
            $message = 'Tweet retweeted';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'is_retweeted' => !$retweet,
                'retweets_count' => $tweet->retweets_count
            ]
        ]);
    }

    public function bookmark(Request $request, Tweet $tweet)
    {
        $user = $request->user();
        $bookmark = Bookmark::where('user_id', $user->id)->where('tweet_id', $tweet->id)->first();

        if ($bookmark) {
            $bookmark->delete();
            $tweet->decrement('bookmarks_count');
            $message = 'Tweet removed from bookmarks';
        } else {
            Bookmark::create(['user_id' => $user->id, 'tweet_id' => $tweet->id]);
            $tweet->increment('bookmarks_count');
            $message = 'Tweet bookmarked';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'is_bookmarked' => !$bookmark,
                'bookmarks_count' => $tweet->bookmarks_count
            ]
        ]);
    }

    public function replies(Tweet $tweet)
    {
        $replies = Tweet::with(['user'])
            ->where('parent_id', $tweet->id)
            ->where('tweet_type', 'reply')
            ->latest()
            ->paginate(50);

        return TweetResource::collection($replies)->additional([
            'success' => true,
            'message' => 'Replies retrieved successfully'
        ]);
    }

    public function reply(StoreTweetRequest $request, Tweet $tweet)
    {
        $reply = Tweet::create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'media' => $request->media,
            'tweet_type' => 'reply',
            'parent_id' => $tweet->id
        ]);

        $tweet->increment('replies_count');
        $request->user()->increment('tweets_count');
        
        $reply->load('user');

        if ($tweet->user_id !== $request->user()->id) {
            $notification = \App\Models\Notification::create([
                'user_id' => $tweet->user_id,
                'actor_id' => $request->user()->id,
                'type' => 'reply',
                'notifiable_type' => get_class($reply),
                'notifiable_id' => $reply->id,
            ]);
            event(new \App\Events\NotificationCreated($notification));
        }

        return response()->json([
            'success' => true,
            'message' => 'Reply sent successfully',
            'data' => new TweetResource($reply)
        ], 201);
    }

    public function quote(StoreTweetRequest $request, Tweet $tweet)
    {
        $quote = Tweet::create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'media' => $request->media,
            'tweet_type' => 'quote',
            'parent_id' => $tweet->id
        ]);

        $tweet->increment('retweets_count'); // usually quotes are counted with retweets
        $request->user()->increment('tweets_count');
        
        $quote->load(['user', 'parent.user']);

        if ($tweet->user_id !== $request->user()->id) {
            $notification = \App\Models\Notification::create([
                'user_id' => $tweet->user_id,
                'actor_id' => $request->user()->id,
                'type' => 'quote',
                'notifiable_type' => get_class($quote),
                'notifiable_id' => $quote->id,
            ]);
            event(new \App\Events\NotificationCreated($notification));
        }

        return response()->json([
            'success' => true,
            'message' => 'Quote tweet created successfully',
            'data' => new TweetResource($quote)
        ], 201);
    }
}
