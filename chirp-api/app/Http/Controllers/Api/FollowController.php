<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Follow;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

/**
 * Class FollowController
 *
 * Menangani sistem follow/unfollow antar pengguna.
 * Mendukung akun privat (follow request pending) dan mengirim
 * notifikasi real-time melalui WebSocket saat user baru di-follow.
 */
class FollowController extends Controller
{
    /**
     * Toggle follow/unfollow pengguna.
     *
     * Jika sudah follow → unfollow (hapus relasi + kurangi counter).
     * Jika belum follow → follow (buat relasi baru + tambah counter).
     * Untuk akun privat, status follow menjadi 'pending' sampai disetujui.
     * Mengirim notifikasi real-time ke user yang di-follow.
     *
     * @param  Request  $request   Request dengan user yang terautentikasi
     * @param  string   $username  Username target yang ingin di-follow/unfollow
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi status follow terbaru
     */
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
                'is_following' => (bool) $user->following()->where('following_id', $targetUser->id)->where('status', 'accepted')->exists(),
                'status' => $user->following()->where('following_id', $targetUser->id)->first()?->pivot?->status,
                'followers_count' => $targetUser->refresh()->followers_count,
            ]
        ]);
    }

    /**
     * Menampilkan daftar followers dari user tertentu.
     *
     * Hanya menampilkan followers yang statusnya 'accepted'.
     *
     * @param  string  $username  Username pengguna
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function followers($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        
        $followers = $user->followers()->wherePivot('status', 'accepted')->paginate(20);

        return UserResource::collection($followers)->additional([
            'success' => true
        ]);
    }

    /**
     * Menampilkan daftar user yang di-follow oleh user tertentu.
     *
     * Hanya menampilkan following yang statusnya 'accepted'.
     *
     * @param  string  $username  Username pengguna
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function following($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        
        $following = $user->following()->wherePivot('status', 'accepted')->paginate(20);

        return UserResource::collection($following)->additional([
            'success' => true
        ]);
    }
}
