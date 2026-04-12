<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\TweetResource;
use App\Models\User;
use App\Models\Tweet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Class UserController
 *
 * Menangani operasi terkait profil pengguna: menampilkan profil,
 * mengupdate data profil & pengaturan akun, menampilkan tweet/media/likes
 * milik user tertentu, dan memberikan saran user untuk di-follow.
 */
class UserController extends Controller
{
    /**
     * Menampilkan profil publik pengguna berdasarkan username.
     *
     * @param  string  $username  Username pengguna yang ingin dilihat
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data UserResource
     */
    public function show($username)
    {
        $user = User::where('username', $username)->firstOrFail();
        
        return response()->json([
            'success' => true,
            'data' => new UserResource($user)
        ]);
    }

    /**
     * Mengupdate data profil pengguna yang sedang login.
     *
     * Memperbarui field seperti name, bio, avatar, header_image, location,
     * website, dan birth_date sesuai data yang divalidasi.
     *
     * @param  UpdateProfileRequest  $request  Data profil yang divalidasi
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data profil yang diperbarui
     */
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

    /**
     * Mengupdate pengaturan akun (email dan password).
     *
     * Untuk mengubah password, user harus menyertakan current_password.
     * Password baru minimal 8 karakter dan harus dikonfirmasi.
     *
     * @param  Request  $request  Data pengaturan (email, current_password, new_password)
     * @return \Illuminate\Http\JsonResponse  Response JSON konfirmasi atau error validasi
     */
    public function updateSettings(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $user->id,
            'current_password' => 'nullable|string',
            'new_password' => 'nullable|string|min:8|confirmed',
        ]);

        if (!empty($validated['new_password'])) {
            if (!$request->current_password || !Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect'
                ], 400);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->email = $validated['email'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => new UserResource($user)
        ]);
    }

    /**
     * Menampilkan daftar tweet milik user berdasarkan username.
     *
     * Mengembalikan tweet, retweet, dan quote yang dibuat oleh user,
     * diurutkan dari yang terbaru dengan pagination.
     *
     * @param  string  $username  Username pengguna
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
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

    /**
     * Menampilkan tweet yang memiliki lampiran media dari user tertentu.
     *
     * @param  string  $username  Username pengguna
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
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

    /**
     * Menampilkan tweet yang di-like oleh user tertentu.
     *
     * Menggunakan relasi hasMany melalui tabel likes untuk mengambil
     * tweet yang pernah di-like oleh user yang bersangkutan.
     *
     * @param  string  $username  Username pengguna
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
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

    /**
     * Mendapatkan saran pengguna untuk di-follow.
     *
     * Mengembalikan 5 user acak yang belum di-follow oleh user
     * yang sedang login (mengecualikan diri sendiri dan yang sudah di-follow).
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi koleksi UserResource
     */
    public function suggestions(Request $request)
    {
        $user = $request->user();
        
        // Get IDs of users the current user is already following
        $followingIds = $user->following()
            ->wherePivot('status', 'accepted')
            ->pluck('users.id')
            ->toArray();
        
        // Add self to exclusion list
        $excludeIds = array_merge($followingIds, [$user->id]);
        
        $suggestions = User::whereNotIn('id', $excludeIds)
            ->inRandomOrder()
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($suggestions)
        ]);
    }
}
