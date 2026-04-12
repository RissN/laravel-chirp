<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tweet;
use App\Models\AuditLog;
use Illuminate\Http\Request;

/**
 * Class ModerationController
 *
 * Menangani moderasi konten tweet oleh admin.
 * Menyediakan fitur pencarian, paginasi (60 item per halaman),
 * dan penghapusan tweet dengan pencatatan audit log.
 */
class ModerationController extends Controller
{
    /**
     * Menampilkan daftar semua tweet untuk moderasi.
     *
     * Mendukung pencarian berdasarkan konten (parameter 'q') dan
     * filter berdasarkan user_id. Paginasi 60 item per halaman
     * untuk memaksimalkan penggunaan layar lebar.
     *
     * @param  Request  $request  Request berisi opsional 'q' dan 'user_id'
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi daftar tweet dan metadata pagination
     */
    public function tweets(Request $request)
    {
        $query = Tweet::with('user')->latest();

        if ($request->q) {
            $query->where('content', 'LIKE', "%{$request->q}%");
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $tweets = $query->paginate(60);

        return response()->json([
            'success' => true,
            'data' => $tweets->items(),
            'meta' => [
                'current_page' => $tweets->currentPage(),
                'last_page' => $tweets->lastPage(),
                'total' => $tweets->total(),
                'per_page' => $tweets->perPage(),
            ]
        ]);
    }

    /**
     * Menghapus tweet berdasarkan ID oleh admin.
     *
     * Mencatat aksi penghapusan ke tabel audit_logs lengkap dengan
     * preview konten, user_id pemilik tweet, IP admin, dan timestamp.
     *
     * @param  Request  $request  Request dari admin yang terautentikasi
     * @param  int      $id       ID tweet yang akan dihapus
     * @return \Illuminate\Http\JsonResponse  Response JSON konfirmasi penghapusan
     */
    public function deleteTweet(Request $request, $id)
    {
        $tweet = Tweet::findOrFail($id);
        $content = substr($tweet->content ?? '', 0, 80);
        $tweet->delete();

        AuditLog::create([
            'admin_id' => $request->user('admin')->id,
            'action' => 'delete_tweet',
            'target_type' => 'Tweet',
            'target_id' => $id,
            'meta' => ['content_preview' => $content, 'user_id' => $tweet->user_id],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => 'Tweet has been deleted.']);
    }
}
