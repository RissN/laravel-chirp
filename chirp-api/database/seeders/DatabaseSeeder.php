<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tweet;
use App\Models\Follow;
use App\Models\Like;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
/*
        // 1. Create a test user
        $testUser = User::factory()->create([
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // 2. Create other users
        $users = User::factory(20)->create();
        $users->push($testUser);

        // 3. Create Tweets
        foreach ($users as $user) {
            Tweet::factory(fake()->numberBetween(5, 15))->create([
                'user_id' => $user->id
            ]);
        }
        
        $tweets = Tweet::all();

        // 4. Create Follows & Likes
        foreach ($users as $user) {
            // Follow random users
            $following = $users->random(fake()->numberBetween(2, 10))->pluck('id')->reject(fn ($id) => $id == $user->id);
            foreach ($following as $followingId) {
                Follow::firstOrCreate([
                    'follower_id' => $user->id,
                    'following_id' => $followingId,
                ]);
            }

            // Like random tweets
            $likedTweets = $tweets->random(fake()->numberBetween(10, 40))->pluck('id');
            foreach ($likedTweets as $tweetId) {
                Like::firstOrCreate([
                    'user_id' => $user->id,
                    'tweet_id' => $tweetId,
                ]);
            }
        }
        
        // Let's create some replies specifically to test threaded replies
        foreach ($tweets->random(10) as $tweet) {
            Tweet::factory(fake()->numberBetween(1, 3))->create([
                'user_id' => $users->random()->id,
                'tweet_type' => 'reply',
                'parent_id' => $tweet->id,
            ]);
        }
*/
    }
}
