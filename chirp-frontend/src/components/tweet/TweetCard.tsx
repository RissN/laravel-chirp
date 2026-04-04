import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Bookmark, Share, Trash2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import type { Tweet } from '../../types';
import { toggleLike, toggleRetweet, toggleBookmark, deleteTweet } from '../../api/tweets';
import { useAuthStore } from '../../store/authStore';

export default function TweetCard({ tweet }: { tweet: Tweet }) {
  const navigate = useNavigate();
  
  const [optimisticLike, setOptimisticLike] = useState(tweet.is_liked);
  const [likesCount, setLikesCount] = useState(tweet.likes_count);
  
  const [optimisticRetweet, setOptimisticRetweet] = useState(tweet.is_retweeted);
  const [retweetsCount, setRetweetsCount] = useState(tweet.retweets_count);
  
  const [optimisticBookmark, setOptimisticBookmark] = useState(tweet.is_bookmarked);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const isOwner = currentUser?.id === tweet.user.id;

  const deleteMutation = useMutation({
    mutationFn: () => deleteTweet(tweet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['profile-tweets'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      
      // If we are on the tweet detail page, navigate back to home
      if (window.location.pathname.includes('/tweet/')) {
        navigate('/home');
      }
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      deleteMutation.mutate();
    }
  };

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(tweet.id),
    onSuccess: (data) => {
      setOptimisticLike(data.data.is_liked);
      setLikesCount(data.data.likes_count);
      // In a real large app we might just target specific queries to invalidate
    }
  });

  const retweetMutation = useMutation({
    mutationFn: () => toggleRetweet(tweet.id),
    onSuccess: (data) => {
      setOptimisticRetweet(data.data.is_retweeted);
      setRetweetsCount(data.data.retweets_count);
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmark(tweet.id),
    onSuccess: (data) => {
      setOptimisticBookmark(data.data.is_bookmarked);
    }
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticLike(!optimisticLike);
    setLikesCount(optimisticLike ? likesCount - 1 : likesCount + 1);
    likeMutation.mutate();
  };

  const handleRetweet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticRetweet(!optimisticRetweet);
    setRetweetsCount(optimisticRetweet ? retweetsCount - 1 : retweetsCount + 1);
    retweetMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticBookmark(!optimisticBookmark);
    bookmarkMutation.mutate();
  };

  const handleNavigate = () => {
    navigate(`/tweet/${tweet.id}`);
  };

  const timeAgo = formatDistanceToNowStrict(new Date(tweet.created_at));

  // Determine actual display tweet (if it's a retweet, the content comes from original_tweet)
  const isRetweet = tweet.tweet_type === 'retweet' && tweet.original_tweet;
  const displayTweet = isRetweet ? tweet.original_tweet! : tweet;
  const repUser = isRetweet ? tweet.user : null;

  return (
    <article 
      onClick={handleNavigate}
      className="border-b border-[var(--border-color)] p-4 hover:bg-[var(--hover-bg)] transition cursor-pointer"
    >
      {/* Retweet Indicator */}
      {isRetweet && repUser && (
        <div className="flex items-center gap-2 mb-1 ml-6 text-sm text-[var(--text-muted)] font-bold">
          <Repeat2 size={16} />
          <Link to={`/${repUser.username}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {repUser.name} reposted
          </Link>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar 
          name={displayTweet.user.name} 
          src={displayTweet.user.avatar} 
          username={displayTweet.user.username} 
        />
        
        <div className="flex-1 overflow-hidden">
          {/* User Info Header */}
          <div className="flex items-center gap-1 text-sm sm:text-base whitespace-nowrap overflow-hidden">
            <Link 
              to={`/${displayTweet.user.username}`} 
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[var(--text-color)] hover:underline truncate"
            >
              {displayTweet.user.name}
            </Link>
            <span className="text-[var(--text-muted)] truncate">@{displayTweet.user.username}</span>
            <span className="text-[var(--text-muted)]">· {timeAgo}</span>
            
            {isOwner && (
              <button 
                onClick={handleDelete}
                className="ml-auto p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition"
                title="Delete tweet"
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={16} className={deleteMutation.isPending ? 'animate-pulse' : ''} />
              </button>
            )}
          </div>

          <p className="text-[var(--text-color)] mt-1 whitespace-pre-wrap word-break">
            {displayTweet.content}
          </p>

          {/* Media Grid */}
          {displayTweet.media && displayTweet.media.length > 0 && (
            <div className={`mt-3 grid gap-1 rounded-2xl overflow-hidden border border-[var(--border-color)] ${
              displayTweet.media.length === 1 ? 'grid-cols-1' :
              displayTweet.media.length === 2 ? 'grid-cols-2' :
              displayTweet.media.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
            }`}>
              {displayTweet.media.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt="Tweet media" 
                  className={`w-full object-cover ${
                    displayTweet.media?.length === 3 && i === 0 ? 'row-span-2 h-full' : 'h-64'
                  }`}
                  onClick={(e) => e.stopPropagation()} 
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-3 max-w-md text-[var(--text-muted)]">
            <button 
              className="flex items-center gap-1.5 group hover:text-[var(--color-chirp)] transition"
              onClick={(e) => { e.stopPropagation(); navigate(`/tweet/${displayTweet.id}`) }}
            >
              <div className="p-2 rounded-full group-hover:bg-[var(--color-chirp)]/10 transition">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm">{displayTweet.replies_count > 0 ? displayTweet.replies_count : ''}</span>
            </button>

            <button 
              className={`flex items-center gap-1.5 group transition ${optimisticRetweet ? 'text-green-500' : 'hover:text-green-500'}`}
              onClick={handleRetweet}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition">
                <Repeat2 size={18} />
              </div>
              <span className="text-sm">{retweetsCount > 0 ? retweetsCount : ''}</span>
            </button>

            <button 
              className={`flex items-center gap-1.5 group transition ${optimisticLike ? 'text-pink-600' : 'hover:text-pink-600'}`}
              onClick={handleLike}
            >
              <div className="p-2 rounded-full group-hover:bg-pink-600/10 transition">
                <motion.div animate={optimisticLike ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Heart size={18} fill={optimisticLike ? "currentColor" : "none"} />
                </motion.div>
              </div>
              <span className="text-sm">{likesCount > 0 ? likesCount : ''}</span>
            </button>

            <button 
              className={`flex items-center group transition ${optimisticBookmark ? 'text-[var(--color-chirp)]' : 'hover:text-[var(--color-chirp)]'}`}
              onClick={handleBookmark}
            >
              <div className="p-2 rounded-full group-hover:bg-[var(--color-chirp)]/10 transition">
                <Bookmark size={18} fill={optimisticBookmark ? "currentColor" : "none"} />
              </div>
            </button>

            <button className="flex items-center group hover:text-[var(--color-chirp)] transition" onClick={(e) => e.stopPropagation()}>
              <div className="p-2 rounded-full group-hover:bg-[var(--color-chirp)]/10 transition">
                <Share size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
