<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTweetRequest;
use App\Http\Resources\TweetResource;
use App\Models\Tweet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Class TweetController
 *
 * Menangani operasi CRUD untuk tweet/postingan pengguna.
 * Termasuk menampilkan timeline, explore, membuat tweet baru,
 * mengedit konten tweet, dan menghapus tweet beserta media terkait.
 * Batas karakter konten tweet: maksimum 250 karakter.
 */
class TweetController extends Controller
{
    /**
     * Menampilkan timeline/beranda pengguna.
     *
     * Mengambil tweet dari user yang di-follow dan tweet milik sendiri,
     * diurutkan dari yang terbaru. Hanya menampilkan tipe: tweet, retweet, quote.
     * Menggunakan pagination 20 item per halaman.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get following IDs
        $followingIds = $user->following()->where('follows.status', 'accepted')->allRelatedIds();
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

    /**
     * Menampilkan feed "For You".
     *
     * Mengambil tweet populer dari seluruh platform, diurutkan berdasarkan
     * skor engagement (likes + retweets + views) dengan prioritas pada
     * konten terbaru (7 hari terakhir). Tidak bergantung pada daftar following.
     *
     * @param  Request  $request  Request HTTP
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function forYou(Request $request)
    {
        $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
            ->whereIn('tweet_type', ['tweet', 'quote'])
            ->where('created_at', '>=', now()->subDays(7))
            ->orderByRaw('(likes_count + retweets_count + views_count) DESC')
            ->latest()
            ->paginate(20);

        // If not enough recent tweets, backfill with older popular ones
        if ($tweets->total() < 20) {
            $tweets = Tweet::with(['user', 'parent.user', 'originalTweet.user'])
                ->whereIn('tweet_type', ['tweet', 'quote'])
                ->orderByRaw('(likes_count + retweets_count + views_count) DESC')
                ->latest()
                ->paginate(20);
        }

        return TweetResource::collection($tweets)->additional([
            'success' => true,
            'message' => 'For You timeline retrieved successfully',
        ]);
    }

    /**
     * Menampilkan halaman Explore.
     *
     * Mengambil seluruh tweet publik, diurutkan berdasarkan popularitas
     * (likes_count, views_count) kemudian waktu terbaru.
     * Tidak bergantung pada daftar following user.
     *
     * @param  Request  $request  Request HTTP
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
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

    /**
     * Membuat tweet baru.
     *
     * Memvalidasi konten (maks 250 karakter) dan media (maks 4 lampiran),
     * mengecek status suspended user, lalu menyimpan tweet ke database.
     * Menambah counter tweets_count pada user.
     *
     * @param  StoreTweetRequest  $request  Data tweet yang sudah divalidasi (content, media)
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data tweet yang dibuat (HTTP 201)
     */
    public function store(StoreTweetRequest $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($user->status === 'suspended') {
            if ($user->banned_until && now()->greaterThan($user->banned_until)) {
                $user->update(['status' => 'active', 'ban_reason' => null, 'banned_until' => null]);
            } else {
                $expiryInfo = $user->banned_until ? " until {$user->banned_until->toDateTimeString()}" : " permanently";
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is suspended' . $expiryInfo . '. You cannot post new content.',
                ], 403);
            }
        }

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

    /**
     * Menampilkan detail satu tweet.
     *
     * Menambah counter views setiap kali dipanggil (view tracking),
     * lalu mengembalikan data lengkap tweet beserta relasi user dan parent.
     *
     * @param  Tweet  $tweet  Instance tweet dari route model binding
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data TweetResource
     */
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

    /**
     * Mengupdate/mengedit tweet yang sudah ada.
     *
     * Hanya pemilik tweet yang bisa mengedit. Memvalidasi konten baru
     * (maks 250 karakter) dan array media. Mengupdate record di database.
     *
     * @param  Request  $request  Data update (content, media)
     * @param  Tweet    $tweet    Instance tweet dari route model binding
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data tweet yang sudah diupdate, atau error 403
     */
    public function update(Request $request, Tweet $tweet)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($tweet->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action'
            ], 403);
        }

        $request->validate([
            'content' => ['required_without:media', 'string', 'max:250', 'nullable'],
            'media' => ['nullable', 'array', 'max:4'],
            'media.*' => ['string', 'url'],
        ]);

        $tweet->update([
            'content' => $request->input('content'),
            'media' => $request->input('media'),
        ]);

        $tweet->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Tweet updated successfully',
            'data' => new TweetResource($tweet)
        ]);
    }

    /**
     * Menghapus tweet.
     *
     * Hanya pemilik tweet yang bisa menghapus. Menghapus file media terkait
     * dari storage disk publik, lalu menghapus record tweet secara soft-delete.
     * Mengurangi counter tweets_count pada user.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @param  Tweet    $tweet    Instance tweet dari route model binding
     * @return \Illuminate\Http\JsonResponse  Response JSON konfirmasi penghapusan, atau error 403
     */
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
