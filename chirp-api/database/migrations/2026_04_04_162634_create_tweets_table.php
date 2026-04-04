<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tweets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('content', 280)->nullable();
            $table->json('media')->nullable();
            $table->enum('tweet_type', ['tweet', 'reply', 'retweet', 'quote'])->default('tweet');
            $table->foreignId('parent_id')->nullable()->constrained('tweets')->onDelete('cascade');
            $table->foreignId('retweet_id')->nullable()->constrained('tweets')->onDelete('cascade');
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('replies_count')->default(0);
            $table->unsignedInteger('retweets_count')->default(0);
            $table->unsignedInteger('bookmarks_count')->default(0);
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tweets');
    }
};
