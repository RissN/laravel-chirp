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

/**
 * Class TweetActionController
 *
 * Menangani aksi interaksi pada tweet: like/unlike, retweet/unretweet,
 * bookmark/unbookmark, reply (komentar), dan quote tweet.
 * Semua aksi menggunakan pola toggle (jika sudah aktif maka nonaktifkan, dan sebaliknya).
 * Mengirim notifikasi real-time melalui WebSocket untuk setiap interaksi.
 */
class TweetActionController extends Controller
{
    /**
     * Toggle like/unlike pada tweet.
     *
     * Jika tweet sudah di-like oleh user, maka unlike (hapus like + kurangi counter).
     * Jika belum, maka like (buat record + tambah counter + kirim notifikasi).
     *
     * @param  Request  $request  Request dengan user terautentikasi
     * @param  Tweet    $tweet    Instance tweet dari route model binding
     * @return \Illuminate\Http\JsonResponse  Status like dan jumlah like terbaru
     */
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

    /**
     * Toggle retweet/unretweet pada tweet.
     *
     * Retweet membuat record baru di tabel tweets dengan tweet_type='retweet'
     * dan menambah counter. Unretweet menghapus record tersebut.
     *
     * @param  Request  $request  Request dengan user terautentikasi
     * @param  Tweet    $tweet    Instance tweet dari route model binding
     * @return \Illuminate\Http\JsonResponse  Status retweet dan jumlah retweet terbaru
     */
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

    /**
     * Toggle bookmark/unbookmark pada tweet.
     *
     * Bookmark menyimpan tweet ke daftar simpan pribadi user.
     * Unbookmark menghapusnya dari daftar tersebut.
     *
     * @param  Request  $request  Request dengan user terautentikasi
     * @param  Tweet    $tweet    Instance tweet dari route model binding
     * @return \Illuminate\Http\JsonResponse  Status bookmark dan jumlah bookmark terbaru
     */
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

    /**
     * Mengambil daftar reply/komentar dari suatu tweet.
     *
     * Mengembalikan tweet bertipe 'reply' yang memiliki parent_id
     * sesuai tweet yang diminta, diurutkan dari yang terbaru.
     *
     * @param  Tweet  $tweet  Instance tweet induk dari route model binding
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
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

    /**
     * Membuat reply/komentar baru pada tweet.
     *
     * Memvalidasi konten (maks 250 karakter), mengecek status suspended user,
     * membuat record tweet bertipe 'reply', menambah counter replies pada
     * tweet induk, dan mengirim notifikasi ke pemilik tweet.
     *
     * @param  StoreTweetRequest  $request  Data reply yang divalidasi
     * @param  Tweet              $tweet    Tweet induk yang dibalas
     * @return \Illuminate\Http\JsonResponse  Data reply yang baru dibuat (HTTP 201)
     */
    public function reply(StoreTweetRequest $request, Tweet $tweet)
    {
        $user = $request->user();
        if ($user->status === 'suspended') {
            if ($user->banned_until && now()->greaterThan($user->banned_until)) {
                $user->update(['status' => 'active', 'ban_reason' => null, 'banned_until' => null]);
            } else {
                $expiryInfo = $user->banned_until ? " until {$user->banned_until->toDateTimeString()}" : " permanently";
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is suspended' . $expiryInfo . '. You cannot post replies.',
                ], 403);
            }
        }

        $reply = Tweet::create([
            'user_id' => $request->user()->id,
            'content' => $request->input('content'),
            'media'   => $request->input('media'),
            'tweet_type' => 'reply',
            'parent_id'  => $tweet->id
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

    /**
     * Membuat quote tweet (retweet dengan komentar).
     *
     * Mirip dengan reply, tetapi membuat tweet independen bertipe 'quote'
     * yang mereferensi tweet asli melalui parent_id.
     *
     * @param  StoreTweetRequest  $request  Data quote yang divalidasi
     * @param  Tweet              $tweet    Tweet yang di-quote
     * @return \Illuminate\Http\JsonResponse  Data quote tweet yang dibuat (HTTP 201)
     */
    public function quote(StoreTweetRequest $request, Tweet $tweet)
    {
        $user = $request->user();
        if ($user->status === 'suspended') {
            if ($user->banned_until && now()->greaterThan($user->banned_until)) {
                $user->update(['status' => 'active', 'ban_reason' => null, 'banned_until' => null]);
            } else {
                $expiryInfo = $user->banned_until ? " until {$user->banned_until->toDateTimeString()}" : " permanently";
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is suspended' . $expiryInfo . '. You cannot post quote tweets.',
                ], 403);
            }
        }

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
