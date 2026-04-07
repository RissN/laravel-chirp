<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->q) {
            $q = $request->q;
            $query->where(function($builder) use ($q) {
                $builder->where('name', 'LIKE', "%{$q}%")
                    ->orWhere('username', 'LIKE', "%{$q}%")
                    ->orWhere('email', 'LIKE', "%{$q}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $users = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ]
        ]);
    }

    public function ban(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
            'duration' => 'nullable|integer', // hours, null means permanent
        ]);

        $user = User::findOrFail($id);
        
        $bannedUntil = $request->duration ? now()->addHours($request->duration) : null;
        
        $user->update([
            'status' => 'banned', 
            'ban_reason' => $request->reason,
            'banned_until' => $bannedUntil,
        ]);

        // Revoke all user tokens
        $user->tokens()->delete();

        AuditLog::create([
            'admin_id' => $request->user('admin')->id,
            'action' => 'ban_user',
            'target_type' => 'User',
            'target_id' => $user->id,
            'meta' => [
                'reason' => $request->reason, 
                'username' => $user->username,
                'until' => $bannedUntil ? $bannedUntil->toDateTimeString() : 'permanent'
            ],
            'ip_address' => $request->ip(),
        ]);

        $message = "User @{$user->username} has been banned " . ($bannedUntil ? "until {$bannedUntil->toDateTimeString()}." : "permanently.");
        return response()->json(['success' => true, 'message' => $message]);
    }

    public function suspend(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
            'duration' => 'nullable|integer', // hours
        ]);

        $user = User::findOrFail($id);
        
        $bannedUntil = $request->duration ? now()->addHours($request->duration) : null;

        $user->update([
            'status' => 'suspended', 
            'ban_reason' => $request->reason,
            'banned_until' => $bannedUntil,
        ]);
        $user->tokens()->delete();

        AuditLog::create([
            'admin_id' => $request->user('admin')->id,
            'action' => 'suspend_user',
            'target_type' => 'User',
            'target_id' => $user->id,
            'meta' => [
                'reason' => $request->reason, 
                'username' => $user->username,
                'until' => $bannedUntil ? $bannedUntil->toDateTimeString() : 'permanent'
            ],
            'ip_address' => $request->ip(),
        ]);

        $message = "User @{$user->username} has been suspended " . ($bannedUntil ? "until {$bannedUntil->toDateTimeString()}." : "permanently.");
        return response()->json(['success' => true, 'message' => $message]);
    }

    public function unban(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'active', 'ban_reason' => null, 'banned_until' => null]);

        AuditLog::create([
            'admin_id' => $request->user('admin')->id,
            'action' => 'unban_user',
            'target_type' => 'User',
            'target_id' => $user->id,
            'meta' => ['username' => $user->username],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => "User @{$user->username} has been reinstated."]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $username = $user->username;
        $user->tokens()->delete();
        $user->delete(); // soft delete

        AuditLog::create([
            'admin_id' => $request->user('admin')->id,
            'action' => 'delete_user',
            'target_type' => 'User',
            'target_id' => $id,
            'meta' => ['username' => $username],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => "User @{$username} has been deleted."]);
    }
}
