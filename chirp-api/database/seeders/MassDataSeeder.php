<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tweet;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Retweet;
use App\Models\Bookmark;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MassDataSeeder extends Seeder
{
    /**
     * Realistic tweet content pool — varied topics, tones, lengths.
     * Many templates include #hashtags for discoverability.
     */
    private array $tweetTemplates = [
        // Tech & Dev
        "Just deployed my first app to production 🚀 The feeling is unreal! #coding #webdev",
        "Anyone else think that debugging is just detective work with extra steps? 🕵️ #developer",
        "Hot take: tabs > spaces. Fight me. #programming",
        "Learning Rust has been the best decision of my career so far 🦀 #rustlang #coding",
        "Why does every JS framework need its own state management solution? 😩 #javascript #react",
        "Just discovered CSS container queries and my mind is blown 🤯 #css #frontend",
        "The best code is the code you never have to write. #cleancode",
        "Pair programming is underrated. Just solved a 3-day bug in 20 minutes with a colleague. #agile",
        "Docker makes everything easier until it doesn't 🐳 #docker #devops",
        "Today I mass-deleted 2000 lines of dead code. It felt therapeutic. 🧹 #refactoring",
        "TypeScript saved me from another runtime error today. Thank the types gods. 🙏 #typescript",
        "My terminal prompt is more customized than my living room at this point. #linux #terminal",
        "PSA: Please write documentation. Future you will thank present you. #docs #bestpractices",
        "Just spent 4 hours on a bug that was a missing semicolon. Classic. #debugging",
        "The best part about open source? The community. The worst part? The issues tab. #opensource",
        "AI pair programming is changing how I code. It's like having a really smart rubber duck. 🦆 #AI #coding",
        "Remember when we thought 640KB of RAM ought to be enough for anybody? Good times. #tech",
        "The cloud is just someone else's computer. Never forget. #cloud #devops",
        "Git blame: the passive-aggressive way to find out who broke production. #git #programming",
        "Sometimes the best architecture is no architecture at all. Keep it simple. #KISS #engineering",
        "Laravel makes backend development a joy 🎉 #laravel #php #webdev",
        "React 19 concurrent features are a game changer for UI performance 🔥 #react #frontend",
        
        // Life & Thoughts
        "Morning coffee hits different when you don't have any meetings 🔥☕ #morningvibes",
        "Nothing beats a quiet evening with a good book and rain outside 🌧️📖 #reading #chill",
        "Took a walk today without my phone. Highly recommend disconnecting sometimes. 🌿 #digital detox",
        "Gratitude post: I'm grateful for the people who still text first. You're the real ones. 💛 #grateful",
        "Reminder: It's okay to rest. You're not a machine. #selfcare",
        "Just watched the sunset from my balcony and everything felt right for a moment. 🌅 #sunset",
        "The older I get, the more I value my peace over everything else. #peace #growth",
        "Small progress is still progress. Don't discount your little wins. ✨ #motivation",
        "Adulting is basically just googling how to do things you were never taught. #adulting",
        "Life update: I've been cooking more at home and honestly? I'm becoming a chef. 👨‍🍳 #homecooking",
        "Mental health check: how are you REALLY doing today? 💙 #mentalhealth",
        "The secret to happiness is lowering your expectations just enough. #lifelessons",
        "I'm at the age where staying up past 10pm feels like a rebellion. #sleeplife",
        "Unpopular opinion: Mondays aren't bad. Your job might be, though. #monday",
        "3 things I wish I knew at 20: 1) Save money 2) Trust fewer people 3) Sleep more #advice",
        "Just organized my entire desk and I feel like a completely new person. #organization",
        "Self-care isn't selfish. Read that again. #selfcare #wellness",
        "Journaling has changed my life more than any app ever could. 📓 #journaling",
        "The gym at 6am crowd is a different breed of human. Respect. 💪 #fitness #gym",
        "Plot twist: the main character energy was inside you all along. #maincharacter",

        // Humor
        "My WiFi went down for 5 minutes so I had to talk to my family. They seem like nice people. 📡 #wifi",
        "I'm not lazy, I'm on energy-saving mode. 🔋 #relatable",
        "My bank account and I are in a long-distance relationship. We've lost touch. 💸 #broke",
        "Autocorrect is my worst enema. I mean enemy. #autocorrect",
        "I told my cat about my problems. She meowed and walked away. Fair enough. 🐱 #catlife",
        "Pro tip: If you respond to every email with 'per my last email,' people stop emailing you. 📧 #workhacks",
        "My cooking skill ranges from 'microwave wizard' to 'slightly burnt toast.' #cooking",
        "I don't need anger management. I need people to stop making me angry. #mood",
        "The fridge sees me more than my friends do at this point. 🧊 #snacking",
        "I'm fluent in three languages: English, sarcasm, and profanity. #humor",
        "My bed and I have a special relationship. We're perfect for each other. 🛏️ #sleep",
        "If procrastination was an Olympic sport, I'd compete tomorrow. #procrastination",
        "I put the 'pro' in procrastination. And the 'crastination.' All of it, really. #productivity",
        "Dating in 2026 is just two people staring at their phones in the same room. #dating",
        "My spirit animal is a sloth on a Monday morning. 🦥 #sloths",

        // Opinions & Culture
        "Just finished watching that new series everyone's talking about. No spoilers but... WOW. 🎬 #tvshows",
        "The best music is the music that takes you back to a specific memory. 🎵 #music #nostalgia",
        "Hot take: movie remakes are never as good as the originals. Change my mind. #movies",
        "Reading physical books >> reading on a screen. The smell alone is worth it. 📚 #bookworm",
        "Podcasts have replaced my need for small talk. I feel informed AND antisocial. #podcasts",
        "Street food >>> fancy restaurants. I will die on this hill. 🌮 #streetfood #foodie",
        "The fact that we have access to all human knowledge on our phones and use it for memes... iconic. #internet",
        "Vinyl records are making a comeback and I'm here for it. 🎶 #vinyl #music",
        "Language learning apps really said 'your streak is more important than your degree.' #duolingo",
        "Photography tip: the best camera is the one you have with you. 📸 #photography",
        "Just tried that viral recipe. It was... mid. Very mid. 😐 #viral #foodie",
        "Classical music slaps and I'm tired of pretending it doesn't. 🎻 #classicalmusic",
        "The golden age of television is NOW. So much good content. Too little time. #streaming",
        "Board game nights > going out. This is the hill I will die on. 🎲 #boardgames",
        "Watched a documentary about space last night and now I feel extremely small. #space #universe",
        
        // Motivation & Hustle
        "Another day, another opportunity to be 1% better than yesterday. 📈 #grind #growth",
        "Consistency beats talent when talent doesn't show up. Keep grinding. #consistency",
        "Your comfort zone is nice, but nothing grows there. Step out. 🌱 #growthmindset",
        "Stop waiting for the perfect moment. Start now. Adjust later. #justdoit",
        "Work in silence. Let your results make the noise. 🤫 #hustle",
        "Three years ago I couldn't have imagined being where I am today. Trust the process. #trusttheprocess",
        "Every expert was once a beginner. Keep going. 🎯 #neverquit",
        "The only competition that matters is with yourself yesterday. #selfimprovement",
        "Discipline > motivation. Motivation fades. Discipline stays. #discipline",
        "Your network is your net worth. Invest in genuine relationships. 🤝 #networking",
        "Not every day will be productive. That's okay. Rest is part of the process. #balance",
        "Dream big. Start small. Act now. 💡 #dreams #startup",
        "The best time to start was yesterday. The second best time is now. #motivation",
        "Embrace failure. It's not the opposite of success — it's part of it. #failure #success",
        "Invest in yourself. It's the one investment that always pays off. 📊 #investing",

        // Random & Short
        "bruh",
        "same 😭",
        "this >>> ",
        "no thoughts just vibes ✨ #vibes",
        "it me",
        "respectfully, no.",
        "say less 🤝",
        "LMAOOO",
        "the way I screamed 😂",
        "okay but why is this so true #truth",
        "manifesting good energy today 🫶 #manifest",
        "I'm in my healing era #healingera",
        "rent is due and so is my mental breakdown 🙃 #adultlife",
        "touch grass, be happy 🌾 #nature",
        "down bad fr fr",
        "new day new me (for the 47th time) #newme",
        "anyone else feel like time is moving weird lately? #time",
        "the vibe today is ☁️ #mood",
        "good morning to everyone except alarm clocks ⏰ #goodmorning",
        "just here for the memes honestly #memes",

        // Questions & Engagement
        "What's a skill you wish you'd learned earlier in life? 🤔 #learning",
        "Drop your favorite song right now. I need new music! 🎧 #musicrecommendation",
        "If you could live anywhere in the world, where would it be? #travel",
        "What's the best advice you've ever received? #advice",
        "Coffee or tea? Choose wisely ☕🍵 #coffeeortea",
        "What's your most controversial food opinion? 🍕 #fooddebate",
        "If you could have dinner with anyone, dead or alive, who would it be? #dinner",
        "What book changed your life? 📖 #bookrecommendation",
        "What's one thing you're proud of this week? #proudmoment",
        "Recommend me a movie for tonight! 🎥 #movienight",
        "What are you currently learning? Share your journey! ✏️ #learninginpublic",
        "Do you believe in work-life balance or work-life integration? #worklife",
        "What's a hobby you picked up recently? #hobbies",
        "If today was your last day, what would you do? #YOLO",
        "What's the most underrated app on your phone? #apps",

        // Food
        "Just made homemade pasta for the first time and I'm never buying store-bought again 🍝 #pasta #homemade",
        "Hot take: pineapple absolutely belongs on pizza. Sorry not sorry 🍍🍕 #pineapplepizza",
        "Found a new ramen place downtown and it's officially my new personality trait 🍜 #ramen #foodie",
        "Meal prepping Sundays >>> scrambling at midnight on Tuesday #mealprep",
        "The Japanese convenience store snacks I ordered finally arrived and I'm in heaven 🇯🇵🍙 #japanesefood",
        "Tried making sourdough again. My starter is more alive than I am. #sourdough #baking",
        "Nothing heals the soul quite like grandma's cooking 🥘 #comfort food #family",
        "If you don't season your food, we can't be friends. Non-negotiable. 🧂 #cooking",
        "Ice cream for dinner because I'm an adult and no one can stop me 🍦 #icecream",
        "Just learned that breakfast for dinner is called 'brinner' and I've never felt more seen. #brinner",
        
        // Travel
        "Just booked a one-way ticket. Sometimes you just need to go. ✈️ #travel #wanderlust",
        "Travel tip: always pack a portable charger. Trust me. 🔌 #traveltips",
        "Getting lost in a new city is the best way to find hidden gems. 🗺️ #exploring",
        "The world is too beautiful to spend your whole life in one place. #travel #adventure",
        "Sunsets look different when you're in a completely different timezone 🌇 #sunsetlover",
        "Airport coffee hits different when you're about to explore somewhere new ☕✈️ #airportlife",
        "Traveling solo taught me more about myself than any self-help book ever could. #solotravel",
        "My passport is my most prized possession at this point. 🛂 #passport #travel",
        "Note to self: learn basic phrases before traveling. 'Excuse me' is universal. #travelhack",
        "Bus rides through the countryside > first class flights. The views alone. 🌄 #countryside",
    ];

    /**
     * Reply templates that feel like genuine responses.
     */
    private array $replyTemplates = [
        "Totally agree with this! 🙌 #facts",
        "Couldn't have said it better myself",
        "This is so relatable 😂 #relatable",
        "Wait, really? Tell me more!",
        "I needed to hear this today. Thank you 🙏 #grateful",
        "Facts. Absolute facts. #truth",
        "Okay but you're so right about this",
        "Hard disagree actually, but I respect your take",
        "This hit home 💯",
        "Adding this to my list of things to remember #noted",
        "The way this made me laugh out loud 😭",
        "Can confirm, been there done that #beenthere",
        "Why does this have so few likes? Underrated tweet",
        "This is the energy I need today ✨ #vibes",
        "Saving this for later because it's too good #saved",
        "You always post the best stuff 🔥",
        "I screenshot this and sent it to everyone I know",
        "Drop the link/recipe/source! 👀",
        "Someone needed to say this. Thank you.",
        "This deserves to go viral honestly #viral",
        "Me every single day 😩 #mood",
        "I feel seen #relatable",
        "Not me reading this at 3am 👁️👁️ #insomnia",
        "spitting facts as always 💅 #fax",
        "the accuracy is concerning 😭😂",
        "okay THIS is the tweet of the day #tweetoftheday",
        "your tweets never miss fr",
        "I just showed this to my friend and they gasped",
        "based take 🗣️ #based",
        "W take 🏆 #winning",
    ];

    public function run(): void
    {
        $this->command->info('🚀 Starting mass data seeding...');
        $this->command->info('   This will create ~600 users with tweets, follows, likes, etc.');
        $this->command->newLine();

        // Use a single hashed password for all users (performance)
        $hashedPassword = Hash::make('password');

        // ─── 1. CREATE 600 USERS ───────────────────────────────────────
        $this->command->info('👤 Creating 600 users...');
        $bar = $this->command->getOutput()->createProgressBar(600);

        $userIds = [];
        $existingUsernames = [];
        $existingEmails = [];
        
        // Batch insert users in chunks for performance
        $usersData = [];
        $now = now();

        for ($i = 1; $i <= 600; $i++) {
            $firstName = fake()->firstName();
            $lastName = fake()->lastName();
            $name = "$firstName $lastName";
            
            // Ensure unique username
            do {
                $username = strtolower($firstName) . strtolower($lastName) . fake()->numberBetween(1, 9999);
                $username = preg_replace('/[^a-z0-9_]/', '', $username);
                $username = substr($username, 0, 15);
            } while (in_array($username, $existingUsernames));
            $existingUsernames[] = $username;

            // Ensure unique email
            do {
                $email = $username . '@' . fake()->freeEmailDomain();
            } while (in_array($email, $existingEmails));
            $existingEmails[] = $email;

            $createdAt = fake()->dateTimeBetween('-6 months', '-1 day');

            $usersData[] = [
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'email_verified_at' => $now,
                'password' => $hashedPassword,
                'bio' => fake()->optional(0.7)->sentence(fake()->numberBetween(4, 12)),
                'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=random&size=200',
                'header_image' => 'https://picsum.photos/seed/' . Str::random(10) . '/600/200',
                'location' => fake()->optional(0.6)->city(),
                'website' => fake()->optional(0.3)->url(),
                'birth_date' => fake()->dateTimeBetween('-50 years', '-16 years')->format('Y-m-d'),
                'is_verified' => fake()->boolean(15),
                'is_private' => fake()->boolean(3),
                'followers_count' => 0,
                'following_count' => 0,
                'tweets_count' => 0,
                'remember_token' => Str::random(10),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            if (count($usersData) >= 50) {
                DB::table('users')->insert($usersData);
                $bar->advance(count($usersData));
                $usersData = [];
            }
        }

        // Insert remaining
        if (!empty($usersData)) {
            DB::table('users')->insert($usersData);
            $bar->advance(count($usersData));
        }

        $bar->finish();
        $this->command->newLine(2);

        // Get all user IDs (including any that existed before)
        $userIds = User::pluck('id')->toArray();
        $userCount = count($userIds);
        $this->command->info("✅ Total users in database: $userCount");

        // ─── 2. CREATE TWEETS (3-8 per user = ~3300 tweets) ────────────
        $this->command->info('📝 Creating tweets...');
        $tweetData = [];
        $tweetCount = 0;
        $templateCount = count($this->tweetTemplates);
        $bar = $this->command->getOutput()->createProgressBar($userCount);

        foreach ($userIds as $userId) {
            $numTweets = fake()->numberBetween(3, 8);
            for ($t = 0; $t < $numTweets; $t++) {
                $createdAt = fake()->dateTimeBetween('-3 months', 'now');
                $tweetData[] = [
                    'user_id' => $userId,
                    'content' => $this->tweetTemplates[array_rand($this->tweetTemplates)],
                    'tweet_type' => 'tweet',
                    'parent_id' => null,
                    'retweet_id' => null,
                    'likes_count' => 0,
                    'replies_count' => 0,
                    'retweets_count' => 0,
                    'bookmarks_count' => 0,
                    'views_count' => fake()->numberBetween(10, 5000),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
                $tweetCount++;
            }

            if (count($tweetData) >= 100) {
                DB::table('tweets')->insert($tweetData);
                $tweetData = [];
            }
            $bar->advance();
        }

        if (!empty($tweetData)) {
            DB::table('tweets')->insert($tweetData);
        }

        $bar->finish();
        $this->command->newLine(2);
        $this->command->info("✅ Created $tweetCount tweets");

        // Get all tweet IDs
        $tweetIds = Tweet::pluck('id')->toArray();
        $totalTweets = count($tweetIds);

        // ─── 3. CREATE REPLIES (~15% of tweets get replies) ────────────
        $this->command->info('💬 Creating replies...');
        $tweetsToReply = array_rand(array_flip($tweetIds), min(intval($totalTweets * 0.15), $totalTweets));
        if (!is_array($tweetsToReply)) $tweetsToReply = [$tweetsToReply];
        
        $replyData = [];
        $replyCount = 0;
        $bar = $this->command->getOutput()->createProgressBar(count($tweetsToReply));

        foreach ($tweetsToReply as $parentTweetId) {
            $numReplies = fake()->numberBetween(1, 5);
            for ($r = 0; $r < $numReplies; $r++) {
                $createdAt = fake()->dateTimeBetween('-2 months', 'now');
                $replyData[] = [
                    'user_id' => $userIds[array_rand($userIds)],
                    'content' => $this->replyTemplates[array_rand($this->replyTemplates)],
                    'tweet_type' => 'reply',
                    'parent_id' => $parentTweetId,
                    'retweet_id' => null,
                    'likes_count' => 0,
                    'replies_count' => 0,
                    'retweets_count' => 0,
                    'bookmarks_count' => 0,
                    'views_count' => fake()->numberBetween(5, 1000),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
                $replyCount++;
            }

            if (count($replyData) >= 100) {
                DB::table('tweets')->insert($replyData);
                $replyData = [];
            }
            $bar->advance();
        }

        if (!empty($replyData)) {
            DB::table('tweets')->insert($replyData);
        }

        $bar->finish();
        $this->command->newLine(2);
        $this->command->info("✅ Created $replyCount replies");

        // Refresh tweet IDs after replies
        $tweetIds = Tweet::where('tweet_type', 'tweet')->pluck('id')->toArray();
        $totalTweets = count($tweetIds);

        // ─── 3.5. SEED HASHTAGS TABLE ──────────────────────────────────
        $this->command->info('#️⃣  Extracting and seeding hashtags...');
        
        // Collect all hashtags from tweet content
        $hashtagCounts = [];
        $allTweets = Tweet::select('content')->whereNotNull('content')->cursor();
        
        foreach ($allTweets as $tweet) {
            preg_match_all('/#([\w\x{0080}-\x{FFFF}]+)/u', $tweet->content ?? '', $matches);
            foreach ($matches[1] as $tag) {
                $tagLower = strtolower($tag);
                $hashtagCounts[$tagLower] = ($hashtagCounts[$tagLower] ?? 0) + 1;
            }
        }

        // Insert unique hashtags with their counts
        $hashtagData = [];
        foreach ($hashtagCounts as $name => $count) {
            $hashtagData[] = [
                'name' => $name,
                'tweets_count' => $count,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($hashtagData)) {
            // Insert in chunks
            foreach (array_chunk($hashtagData, 50) as $chunk) {
                DB::table('hashtags')->insert($chunk);
            }
        }

        $this->command->info('✅ Seeded ' . count($hashtagCounts) . ' unique hashtags');

        // ─── 4. CREATE FOLLOWS (~20-50 follows per user) ───────────────
        $this->command->info('🤝 Creating follow relationships...');
        $followData = [];
        $followCount = 0;
        $bar = $this->command->getOutput()->createProgressBar($userCount);

        foreach ($userIds as $userId) {
            $numFollowing = fake()->numberBetween(10, min(50, $userCount - 1));
            // Pick random users to follow (excluding self)
            $possibleFollows = array_diff($userIds, [$userId]);
            $toFollow = (array) array_rand(array_flip($possibleFollows), min($numFollowing, count($possibleFollows)));

            foreach ($toFollow as $followingId) {
                $followData[] = [
                    'follower_id' => $userId,
                    'following_id' => $followingId,
                    'status' => 'accepted',
                    'created_at' => fake()->dateTimeBetween('-3 months', 'now'),
                    'updated_at' => now(),
                ];
                $followCount++;
            }

            if (count($followData) >= 200) {
                try {
                    DB::table('follows')->insert($followData);
                } catch (\Exception $e) {
                    // Handle duplicate key errors silently
                    foreach ($followData as $row) {
                        DB::table('follows')->insertOrIgnore([$row]);
                    }
                }
                $followData = [];
            }
            $bar->advance();
        }

        if (!empty($followData)) {
            try {
                DB::table('follows')->insert($followData);
            } catch (\Exception $e) {
                foreach ($followData as $row) {
                    DB::table('follows')->insertOrIgnore([$row]);
                }
            }
        }

        $bar->finish();
        $this->command->newLine(2);
        $this->command->info("✅ Created ~$followCount follow relationships");

        // ─── 5. CREATE LIKES (~10-30 likes per user) ───────────────────
        $this->command->info('❤️ Creating likes...');
        $likeData = [];
        $likeCount = 0;
        $bar = $this->command->getOutput()->createProgressBar($userCount);

        foreach ($userIds as $userId) {
            $numLikes = fake()->numberBetween(10, min(30, $totalTweets));
            $tweetsToLike = (array) array_rand(array_flip($tweetIds), $numLikes);

            foreach ($tweetsToLike as $tweetId) {
                $likeData[] = [
                    'user_id' => $userId,
                    'tweet_id' => $tweetId,
                    'created_at' => fake()->dateTimeBetween('-3 months', 'now'),
                    'updated_at' => now(),
                ];
                $likeCount++;
            }

            if (count($likeData) >= 200) {
                try {
                    DB::table('likes')->insert($likeData);
                } catch (\Exception $e) {
                    foreach ($likeData as $row) {
                        DB::table('likes')->insertOrIgnore([$row]);
                    }
                }
                $likeData = [];
            }
            $bar->advance();
        }

        if (!empty($likeData)) {
            try {
                DB::table('likes')->insert($likeData);
            } catch (\Exception $e) {
                foreach ($likeData as $row) {
                    DB::table('likes')->insertOrIgnore([$row]);
                }
            }
        }

        $bar->finish();
        $this->command->newLine(2);
        $this->command->info("✅ Created ~$likeCount likes");

        // ─── 6. CREATE RETWEETS (~5% of users retweet ~5 tweets) ───────
        $this->command->info('🔁 Creating retweets...');
        $retweetData = [];
        $retweetCount = 0;
        $retweetingUsers = array_rand(array_flip($userIds), intval($userCount * 0.3));
        if (!is_array($retweetingUsers)) $retweetingUsers = [$retweetingUsers];
        $bar = $this->command->getOutput()->createProgressBar(count($retweetingUsers));

        foreach ($retweetingUsers as $userId) {
            $numRetweets = fake()->numberBetween(1, 5);
            $tweetsToRetweet = (array) array_rand(array_flip($tweetIds), min($numRetweets, $totalTweets));

            foreach ($tweetsToRetweet as $tweetId) {
                $retweetData[] = [
                    'user_id' => $userId,
                    'tweet_id' => $tweetId,
                    'created_at' => fake()->dateTimeBetween('-2 months', 'now'),
                    'updated_at' => now(),
                ];
                $retweetCount++;
            }

            if (count($retweetData) >= 200) {
                try {
                    DB::table('retweets')->insert($retweetData);
                } catch (\Exception $e) {
                    foreach ($retweetData as $row) {
                        DB::table('retweets')->insertOrIgnore([$row]);
                    }
                }
                $retweetData = [];
            }
            $bar->advance();
        }

        if (!empty($retweetData)) {
            try {
                DB::table('retweets')->insert($retweetData);
            } catch (\Exception $e) {
                foreach ($retweetData as $row) {
                    DB::table('retweets')->insertOrIgnore([$row]);
                }
            }
        }

        $bar->finish();
        $this->command->newLine(2);
        $this->command->info("✅ Created ~$retweetCount retweets");

        // ─── 7. CREATE BOOKMARKS (~10% of users bookmark ~5 tweets) ────
        $this->command->info('🔖 Creating bookmarks...');
        $bookmarkData = [];
        $bookmarkCount = 0;
        $bookmarkingUsers = array_rand(array_flip($userIds), intval($userCount * 0.2));
        if (!is_array($bookmarkingUsers)) $bookmarkingUsers = [$bookmarkingUsers];
        $bar = $this->command->getOutput()->createProgressBar(count($bookmarkingUsers));

        foreach ($bookmarkingUsers as $userId) {
            $numBookmarks = fake()->numberBetween(2, 8);
            $tweetsToBookmark = (array) array_rand(array_flip($tweetIds), min($numBookmarks, $totalTweets));

            foreach ($tweetsToBookmark as $tweetId) {
                $bookmarkData[] = [
                    'user_id' => $userId,
                    'tweet_id' => $tweetId,
                    'created_at' => fake()->dateTimeBetween('-2 months', 'now'),
                    'updated_at' => now(),
                ];
                $bookmarkCount++;
            }

            if (count($bookmarkData) >= 200) {
                try {
                    DB::table('bookmarks')->insert($bookmarkData);
                } catch (\Exception $e) {
                    foreach ($bookmarkData as $row) {
                        DB::table('bookmarks')->insertOrIgnore([$row]);
                    }
                }
                $bookmarkData = [];
            }
            $bar->advance();
        }

        if (!empty($bookmarkData)) {
            try {
                DB::table('bookmarks')->insert($bookmarkData);
            } catch (\Exception $e) {
                foreach ($bookmarkData as $row) {
                    DB::table('bookmarks')->insertOrIgnore([$row]);
                }
            }
        }

        $bar->finish();
        $this->command->newLine(2);
        $this->command->info("✅ Created ~$bookmarkCount bookmarks");

        // ─── 8. UPDATE COUNTER CACHES ──────────────────────────────────
        $this->command->info('🔄 Updating counter caches...');

        // Update tweets_count on users
        DB::statement('
            UPDATE users SET tweets_count = (
                SELECT COUNT(*) FROM tweets 
                WHERE tweets.user_id = users.id 
                AND tweets.deleted_at IS NULL
            )
        ');

        // Update followers_count on users
        DB::statement('
            UPDATE users SET followers_count = (
                SELECT COUNT(*) FROM follows 
                WHERE follows.following_id = users.id 
                AND follows.status = \'accepted\'
            )
        ');

        // Update following_count on users
        DB::statement('
            UPDATE users SET following_count = (
                SELECT COUNT(*) FROM follows 
                WHERE follows.follower_id = users.id 
                AND follows.status = \'accepted\'
            )
        ');

        // Update likes_count on tweets
        DB::statement('
            UPDATE tweets SET likes_count = (
                SELECT COUNT(*) FROM likes 
                WHERE likes.tweet_id = tweets.id
            )
        ');

        // Update replies_count on tweets
        DB::statement('
            UPDATE tweets SET replies_count = (
                SELECT COUNT(*) FROM tweets AS replies 
                WHERE replies.parent_id = tweets.id 
                AND replies.deleted_at IS NULL
            )
        ');

        // Update retweets_count on tweets
        DB::statement('
            UPDATE tweets SET retweets_count = (
                SELECT COUNT(*) FROM retweets 
                WHERE retweets.tweet_id = tweets.id
            )
        ');

        // Update bookmarks_count on tweets
        DB::statement('
            UPDATE tweets SET bookmarks_count = (
                SELECT COUNT(*) FROM bookmarks 
                WHERE bookmarks.tweet_id = tweets.id
            )
        ');

        $this->command->info('✅ Counter caches updated!');
        $this->command->newLine();

        // ─── SUMMARY ───────────────────────────────────────────────────
        $finalUsers = User::count();
        $finalTweets = Tweet::count();
        $finalFollows = DB::table('follows')->count();
        $finalLikes = DB::table('likes')->count();
        $finalRetweets = DB::table('retweets')->count();
        $finalBookmarks = DB::table('bookmarks')->count();
        $finalHashtags = DB::table('hashtags')->count();

        $this->command->info('╔══════════════════════════════════════╗');
        $this->command->info('║     🎉 SEEDING COMPLETE!            ║');
        $this->command->info('╠══════════════════════════════════════╣');
        $this->command->info("║  👤 Users:     $finalUsers");
        $this->command->info("║  📝 Tweets:    $finalTweets");
        $this->command->info("║  🤝 Follows:   $finalFollows");
        $this->command->info("║  ❤️  Likes:     $finalLikes");
        $this->command->info("║  🔁 Retweets:  $finalRetweets");
        $this->command->info("║  🔖 Bookmarks: $finalBookmarks");
        $this->command->info("║  #️⃣  Hashtags:  $finalHashtags");
        $this->command->info('╚══════════════════════════════════════╝');
        $this->command->newLine();
        $this->command->info('📌 All dummy accounts use password: "password"');
    }
}
