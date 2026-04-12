<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\Request;

/**
 * Class NotificationController
 *
 * Menangani sistem notifikasi pengguna: mengambil daftar notifikasi,
 * menandai semua sebagai sudah dibaca, dan menghitung jumlah yang belum dibaca.
 * Notifikasi meliputi: like, reply, retweet, follow, dan quote.
 */
class NotificationController extends Controller
{
    /**
     * Mengambil daftar notifikasi pengguna yang sedang login.
     *
     * Mengembalikan notifikasi beserta data actor (siapa yang melakukan aksi)
     * dan notifiable (objek terkait), diurutkan dari yang terbaru.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()
            ->with(['actor', 'notifiable'])
            ->latest()
            ->paginate(20);

        return NotificationResource::collection($notifications)->additional([
            'success' => true
        ]);
    }

    /**
     * Menandai semua notifikasi sebagai sudah dibaca.
     *
     * Mengupdate field read_at pada semua notifikasi yang belum dibaca
     * menjadi timestamp saat ini.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\JsonResponse  Response JSON konfirmasi
     */
    public function readAll(Request $request)
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    /**
     * Menghitung jumlah notifikasi yang belum dibaca.
     *
     * Digunakan oleh frontend untuk menampilkan badge/counter
     * pada ikon notifikasi di sidebar navigasi.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi unread_count
     */
    public function unreadCount(Request $request)
    {
        $count = $request->user()->notifications()->whereNull('read_at')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $count
            ]
        ]);
    }
}
