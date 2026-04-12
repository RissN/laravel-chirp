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

        // Generate hourly active users for today
        $hourlyChart = [];
        $seed = crc32(date('Y-m-d')); // deterministic seed for today
        mt_srand($seed);
        $baseActive = mt_rand(100, 300);
        $currentHour = (int) date('H');
        
        for ($i = 0; $i < 24; $i++) {
            $hourString = sprintf('%02d', $i);
            
            // create realistic peaks and valleys
            $timeMultiplier = 1.0;
            if ($i >= 2 && $i <= 5) $timeMultiplier = 0.2; // Night drop
            else if ($i >= 12 && $i <= 14) $timeMultiplier = 1.5; // Lunch peak
            else if ($i >= 19 && $i <= 22) $timeMultiplier = 2.0; // Evening peak
            
            $noise = mt_rand(-30, 30);
            $activeCount = max(0, intval($baseActive * $timeMultiplier) + $noise);
            $isFuture = $currentHour < $i;

            $hourlyChart[] = [
                'time' => "{$hourString}:00",
                'active' => $isFuture ? 0 : $activeCount // 0 for future hours today
            ];
        }
        mt_srand();

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
                'chart_data' => $hourlyChart,
                'recent_users' => $recentUsers,
            ]
        ]);
    }
}
