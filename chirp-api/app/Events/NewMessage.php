<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = new MessageResource($message);
    }

    public function broadcastOn(): array
    {
        // Broadcast specifically to the receiver's private messages channel
        return [
            new PrivateChannel('user.' . $this->message->receiver_id . '.messages'),
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'message.new';
    }
}
