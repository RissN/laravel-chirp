<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        
        $otherUser = $this->user_one_id === $user->id 
            ? $this->userTwo 
            : $this->userOne;

        return [
            'id' => $this->id,
            'other_user' => new UserResource($otherUser),
            'last_message' => new MessageResource($this->whenLoaded('lastMessage')),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
