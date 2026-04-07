<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tweet;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $bannedUsers = User::where('status', 'banned')->count();
        $totalTweets = Tweet::count();
        $totalReports = \App\Models\Report::count();
        $pendingReports = \App\Models\Report::where('status', 'pending')->count();

        // Growth: users in last 7 days
        $newUsersThisWeek = User::where('created_at', '>=', now()->subDays(7))->count();
        $newTweetsThisWeek = Tweet::where('created_at', '>=', now()->subDays(7))->count();

        // Recent registrations
        $recentUsers = User::latest()->take(5)->get(['id', 'name', 'username', 'avatar', 'created_at', 'status']);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'banned_users' => $bannedUsers,
                    'total_tweets' => $totalTweets,
                    'total_reports' => $totalReports,
                    'pending_reports' => $pendingReports,
                    'new_users_this_week' => $newUsersThisWeek,
                    'new_tweets_this_week' => $newTweetsThisWeek,
                ],
                'recent_users' => $recentUsers,
            ]
        ]);
    }
}
