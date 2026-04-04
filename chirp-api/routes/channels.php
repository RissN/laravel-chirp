<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// For private messages
Broadcast::channel('user.{id}.messages', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// For private notifications
Broadcast::channel('user.{id}.notifications', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
