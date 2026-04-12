<?php

namespace App\Events;

use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public $notification;

    public function __construct(Notification $notification)
    {
        // We ensure relationship is loaded before sending
        $notification->load(['actor', 'notifiable']);
        $this->notification = new NotificationResource($notification);
    }

    public function broadcastOn(): array
    {
        // Broadcast into the recipient's private notification channel
        return [
            new PrivateChannel('user.' . $this->notification->user_id . '.notifications'),
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'notification.created';
    }
}
