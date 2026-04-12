<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use Illuminate\Http\Request;

/**
 * Class ConversationController
 *
 * Menangani sistem Direct Message (DM) antar pengguna.
 * Fitur meliputi: melihat daftar percakapan, membaca pesan dalam percakapan,
 * mengirim pesan baru (dengan dukungan media), dan menandai pesan sebagai sudah dibaca.
 * Semua pesan dikirim secara real-time melalui WebSocket (Laravel Reverb).
 */
class ConversationController extends Controller
{
    /**
     * Mengambil daftar semua percakapan user yang sedang login.
     *
     * Mengembalikan percakapan beserta data kedua partisipan dan
     * pesan terakhir, diurutkan berdasarkan aktivitas terbaru.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $conversations = Conversation::with(['userOne', 'userTwo', 'lastMessage'])
            ->where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->orderByDesc('updated_at')
            ->get();

        return ConversationResource::collection($conversations)->additional([
            'success' => true
        ]);
    }

    /**
     * Mengambil daftar pesan dalam satu percakapan.
     *
     * Memverifikasi bahwa user yang login adalah partisipan percakapan.
     * Mengembalikan pesan beserta data pengirim, diurutkan terbaru terlebih dahulu.
     *
     * @param  Request       $request       Request dengan user yang terautentikasi
     * @param  Conversation  $conversation  Instance percakapan dari route model binding
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection|\Illuminate\Http\JsonResponse
     */
    public function messages(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        // Security check
        if ($conversation->user_one_id !== $user->id && $conversation->user_two_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $messages = Message::with('sender')
            ->where(function ($q) use ($conversation) {
                $q->where('sender_id', $conversation->user_one_id)
                  ->where('receiver_id', $conversation->user_two_id);
            })
            ->orWhere(function ($q) use ($conversation) {
                $q->where('sender_id', $conversation->user_two_id)
                  ->where('receiver_id', $conversation->user_one_id);
            })
            ->latest()
            ->paginate(50);

        return MessageResource::collection($messages)->additional([
            'success' => true
        ]);
    }

    /**
     * Mengirim pesan baru ke pengguna lain.
     *
     * Membuat percakapan baru jika belum ada, lalu menyimpan pesan
     * dan men-trigger event NewMessage untuk pengiriman real-time via WebSocket.
     *
     * @param  Request  $request  Request berisi content dan opsional media
     * @param  int      $userId   ID user penerima pesan
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data pesan yang dikirim
     */
    public function send(Request $request, $userId)
    {
        $request->validate([
            'content' => ['required_without:media', 'string', 'nullable'],
            'media' => ['nullable', 'array', 'max:4'],
        ]);

        $sender = $request->user();
        $receiver = User::findOrFail($userId);

        // Find or create conversation
        $conversation = Conversation::where(function ($q) use ($sender, $receiver) {
            $q->where('user_one_id', $sender->id)->where('user_two_id', $receiver->id);
        })->orWhere(function ($q) use ($sender, $receiver) {
            $q->where('user_one_id', $receiver->id)->where('user_two_id', $sender->id);
        })->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'user_one_id' => $sender->id,
                'user_two_id' => $receiver->id
            ]);
        }

        $message = Message::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'content' => $request->content,
            'media' => $request->media,
        ]);

        $conversation->update([
            'last_message_id' => $message->id,
            'updated_at' => now(), // update timestamps so it surfaces to top
        ]);

        $message->load('sender');

        event(new \App\Events\NewMessage($message));

        return response()->json([
            'success' => true,
            'data' => new MessageResource($message)
        ]);
    }

    /**
     * Menandai semua pesan dalam percakapan sebagai sudah dibaca.
     *
     * Mengupdate field read_at pada pesan-pesan yang diterima oleh user
     * yang sedang login dan belum ditandai sebagai dibaca.
     *
     * @param  Request       $request       Request dengan user yang terautentikasi
     * @param  Conversation  $conversation  Instance percakapan dari route model binding
     * @return \Illuminate\Http\JsonResponse  Response JSON konfirmasi
     */
    public function read(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        // Mark all unread messages sent by the other person as read
        Message::where(function ($q) use ($conversation) {
                $q->where('sender_id', $conversation->user_one_id)
                  ->orWhere('sender_id', $conversation->user_two_id);
            })
            ->where('receiver_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
