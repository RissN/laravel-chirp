<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TweetController;
use App\Http\Controllers\Api\TweetActionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\TrendingController;
use App\Http\Controllers\Api\MediaController;

Route::middleware('throttle:60,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::middleware(['auth:sanctum', 'throttle:300,1'])->group(function () {
    // Auth Routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Tweet Routes
    Route::get('/tweets', [TweetController::class, 'index']); // Following timeline
    Route::get('/tweets/explore', [TweetController::class, 'explore']); // Explore
    Route::post('/tweets', [TweetController::class, 'store']); // Create
    Route::get('/tweets/{tweet}', [TweetController::class, 'show']); // Detail
    Route::delete('/tweets/{tweet}', [TweetController::class, 'destroy']); // Delete

    // Tweet Actions
    Route::post('/tweets/{tweet}/like', [TweetActionController::class, 'like']);
    Route::post('/tweets/{tweet}/retweet', [TweetActionController::class, 'retweet']);
    Route::post('/tweets/{tweet}/bookmark', [TweetActionController::class, 'bookmark']);
    Route::get('/tweets/{tweet}/replies', [TweetActionController::class, 'replies']);
    Route::post('/tweets/{tweet}/reply', [TweetActionController::class, 'reply']);
    Route::post('/tweets/{tweet}/quote', [TweetActionController::class, 'quote']);

    // User & Profile
    Route::get('/users/search', [SearchController::class, 'search']);
    Route::put('/users/profile', [UserController::class, 'update']);
    Route::get('/users/{username}', [UserController::class, 'show']);
    Route::get('/users/{username}/tweets', [UserController::class, 'tweets']);
    Route::get('/users/{username}/media', [UserController::class, 'media']);
    Route::get('/users/{username}/likes', [UserController::class, 'likes']);
    
    // Follow System
    Route::post('/users/{username}/follow', [FollowController::class, 'toggleFollow']);
    Route::get('/users/{username}/followers', [FollowController::class, 'followers']);
    Route::get('/users/{username}/following', [FollowController::class, 'following']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);

    // Bookmarks
    Route::get('/bookmarks', [BookmarkController::class, 'index']);

    // Messages
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('/conversations/{userId}/send', [ConversationController::class, 'send']);
    Route::post('/conversations/{conversation}/read', [ConversationController::class, 'read']);

    // Search & Trending
    Route::get('/search', [SearchController::class, 'searchAll']);
    Route::get('/trending', [SearchController::class, 'trending']);

    // Media
    Route::post('/media/upload', [MediaController::class, 'upload']);
});
