<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
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
