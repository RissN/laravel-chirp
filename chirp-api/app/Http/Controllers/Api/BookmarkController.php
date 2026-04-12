<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tweet;
use App\Http\Resources\TweetResource;
use Illuminate\Http\Request;

/**
 * Class BookmarkController
 *
 * Menangani fitur bookmark/simpan tweet. Menampilkan daftar tweet
 * yang telah di-bookmark oleh pengguna yang sedang login,
 * diurutkan berdasarkan waktu bookmark terbaru.
 */
class BookmarkController extends Controller
{
    /**
     * Mengambil daftar tweet yang di-bookmark oleh user yang sedang login.
     *
     * Melakukan JOIN dengan tabel bookmarks untuk mendapatkan tweet
     * yang ditandai, diurutkan berdasarkan waktu penyimpanan terbaru.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
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
