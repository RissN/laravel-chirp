<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Follow;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function toggleFollow(Request $request, $username)
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $user = $request->user();

        if ($user->id === $targetUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot follow yourself'
            ], 400);
        }

        $follow = Follow::where('follower_id', $user->id)->where('following_id', $targetUser->id)->first();

        if ($follow) {
            $follow->delete();
            $user->decrement('following_count');
            $targetUser->decrement('followers_count');
            $message = 'Unfollowed successfully';
        } else {
            Follow::create([
                'follower_id' => $user->id,
                'following_id' => $targetUser->id,
                'status' => $targetUser->is_private ? 'pending' : 'accepted'
            ]);
            
            if (!$targetUser->is_private) {
                $user->increment('following_count');
                $targetUser->increment('followers_count');
                
                // Real-time Notification
                $notification = \App\Models\Notification::create([
                    'user_id' => $targetUser->id,
                    'actor_id' => $user->id,
                    'type' => 'follow',
                    'notifiable_type' => get_class($user),
                    'notifiable_id' => $user->id,
                ]);
                event(new \App\Events\NotificationCreated($notification));
            }
            $message = $targetUser->is_private ? 'Follow request sent' : 'Followed successfully';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'is_following' => !$follow,
                'followers_count' => $targetUser->followers_count,
            ]
        ]);
    }

    public function followers($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        
        $followers = User::whereHas('following', function ($q) use ($user) {
            $q->where('following_id', $user->id)->where('status', 'accepted');
        })->paginate(20);

        return UserResource::collection($followers)->additional([
            'success' => true
        ]);
    }

    public function following($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        
        $following = User::whereHas('followers', function ($q) use ($user) {
            $q->where('follower_id', $user->id)->where('status', 'accepted');
        })->paginate(20);

        return UserResource::collection($following)->additional([
            'success' => true
        ]);
    }
}
