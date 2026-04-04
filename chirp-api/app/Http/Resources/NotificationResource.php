<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'actor' => new UserResource($this->whenLoaded('actor')),
            'type' => $this->type,
            'data' => $this->data,
            'read_at' => $this->read_at,
            'created_at' => $this->created_at->toISOString(),
            'notifiable' => $this->notifiable_type === 'App\\Models\\Tweet' 
                ? new TweetResource($this->whenLoaded('notifiable'))
                : new UserResource($this->whenLoaded('notifiable'))
        ];
    }
}
