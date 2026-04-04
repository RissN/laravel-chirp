<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'bio' => $this->bio,
            'avatar' => $this->avatar,
            'header_image' => $this->header_image,
            'location' => $this->location,
            'website' => $this->website,
            'birth_date' => $this->birth_date ? $this->birth_date->format('Y-m-d') : null,
            'is_verified' => $this->is_verified,
            'is_private' => $this->is_private,
            'followers_count' => $this->followers_count,
            'following_count' => $this->following_count,
            'tweets_count' => $this->tweets_count,
            'joined_at' => $this->created_at->format('M Y'), // e.g. "Mar 2024"
        ];
    }
}
