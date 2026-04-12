<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tweet;
use App\Models\Hashtag;
use App\Http\Resources\UserResource;
use App\Http\Resources\TweetResource;
use Illuminate\Http\Request;

/**
 * Class SearchController
 *
 * Menangani fitur pencarian global dan trending topics.
 * Mendukung pencarian user berdasarkan nama/username dan tweet berdasarkan konten.
 * Juga menyediakan endpoint terpisah untuk pencarian user saja.
 */
class SearchController extends Controller
{
    /**
     * Pencarian global untuk user dan tweet.
     *
     * Mencari berdasarkan query parameter 'q'. Mendukung filter tipe:
     * 'all' (keduanya), 'users' (hanya user), 'tweets' (hanya tweet).
     * Juga mendukung pencarian hashtag (contoh: #laravel).
     *
     * @param  Request  $request  Request berisi query 'q' dan opsional 'type'
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi hasil pencarian
     */
    public function searchAll(Request $request)
    {
        $q = $request->query('q');
        if ($q) {
            $q = ltrim($q, '@');
        }
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

    /**
     * Mengambil daftar hashtag yang sedang trending.
     *
     * Mengembalikan 10 hashtag teratas berdasarkan jumlah tweet
     * yang menggunakan hashtag tersebut (tweets_count).
     *
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi daftar hashtag trending
     */
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
    /**
     * Pencarian khusus user saja.
     *
     * Digunakan oleh fitur autocomplete dan pencarian user di sidebar.
     * Mencari berdasarkan nama atau username dengan pagination.
     *
     * @param  Request  $request  Request berisi query 'q'
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function search(Request $request)
    {
        $q = $request->query('q');
        
        if ($q) {
            $q = ltrim($q, '@');
        }
        
        $users = User::where('name', 'LIKE', "%{$q}%")
            ->orWhere('username', 'LIKE', "%{$q}%")
            ->paginate(20);

        return UserResource::collection($users)->additional([
            'success' => true
        ]);
    }
}
