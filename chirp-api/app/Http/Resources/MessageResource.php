<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sender_id' => $this->sender_id,
            'receiver_id' => $this->receiver_id,
            'content' => $this->content,
            'media' => $this->media,
            'read_at' => $this->read_at,
            'created_at' => $this->created_at->toISOString(),
            'sender' => new UserResource($this->whenLoaded('sender')),
        ];
    }
}
