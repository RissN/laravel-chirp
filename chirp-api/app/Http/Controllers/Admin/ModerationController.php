<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tweet;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
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
