<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_id',
    ];

    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function messages(): HasMany
    {
        // A conversation doesn't natively have a foreign key in messages out of the box,
        // unless we add conversation_id to messages, which is cleaner. 
        // But the schema doesn't have conversation_id in messages table!
        // The messages have sender_id and receiver_id.
        // We will just fetch messages where (sender = 1 & receiver = 2) or (sender = 2 & receiver = 1)
        throw new \Exception("Relationship requires custom query due to lack of conversation_id in messages table.");
    }
}
