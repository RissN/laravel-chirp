import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Bookmark, Share, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import ReportModal from './ReportModal';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNowStrict } from 'date-fns';
import Avatar from '../ui/Avatar';
import type { Tweet } from '../../types';
import { toggleLike, toggleRetweet, toggleBookmark, deleteTweet } from '../../api/tweets';
import { useAuthStore } from '../../store/authStore';
import { useModal } from '../ui/ModalProvider';
import { useToast } from '../ui/ToastProvider';

export default function TweetCard({ tweet }: { tweet: Tweet }) {
  const navigate = useNavigate();
  
  const [optimisticLike, setOptimisticLike] = useState(tweet.is_liked);
  const [likesCount, setLikesCount] = useState(tweet.likes_count);
  
  const [optimisticRetweet, setOptimisticRetweet] = useState(tweet.is_retweeted);
  const [retweetsCount, setRetweetsCount] = useState(tweet.retweets_count);
  
  const [optimisticBookmark, setOptimisticBookmark] = useState(tweet.is_bookmarked);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { confirm } = useModal();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

      showToast('Tweet deleted successfully', 'success');
    },
    onError: () => {
      showToast('Failed to delete tweet', 'error');
    }
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isConfirmed = await confirm({
      title: 'Delete Tweet?',
      message: 'This cannot be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from Chirp search results.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });

    if (isConfirmed) {
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
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
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
      className="border-b border-[var(--border-color)]/30 p-4 hover:bg-[var(--hover-bg)]/30 transition-all duration-300 cursor-pointer group/tweet relative"
    >
      {/* Retweet Indicator */}
      {isRetweet && repUser && (
        <div className="flex items-center gap-2 mb-2 ml-9 text-[13px] text-[var(--text-muted)] font-bold">
          <Repeat2 size={16} strokeWidth={3} />
          <Link to={`/${repUser.username}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {repUser.name} reposted
          </Link>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <Avatar 
            name={displayTweet.user.name} 
            src={displayTweet.user.avatar} 
            username={displayTweet.user.username} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* User Info Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link 
                to={`/${displayTweet.user.username}`} 
                onClick={(e) => e.stopPropagation()}
                className="font-extrabold text-[var(--text-color)] hover:underline truncate text-[15px]"
              >
                {displayTweet.user.name}
              </Link>
              <span className="text-[var(--text-muted)] truncate text-[14px]">@{displayTweet.user.username}</span>
              <span className="text-[var(--text-muted)] text-[14px]">· {timeAgo}</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--color-chirp)] hover:bg-[var(--color-chirp)]/10 rounded-full transition-colors"
                title="More"
              >
                <MoreHorizontal size={18} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-0 right-0 mt-8 w-48 bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-2xl"
                    >
                      {isOwner ? (
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors font-bold"
                        >
                          <Trash2 size={16} /> Delete Tweet
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsReportModalOpen(true); setIsMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/10 flex items-center gap-3 transition-colors font-medium"
                        >
                          <AlertTriangle size={16} className="text-orange-500/70" /> Report Tweet
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-[var(--text-color)] mt-0.5 text-[15px] leading-relaxed whitespace-pre-wrap" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {displayTweet.content}
          </p>

          {/* Media Grid */}
          {displayTweet.media && displayTweet.media.length > 0 && (
            <div className={`mt-3 grid gap-2 rounded-2xl overflow-hidden border border-[var(--border-color)]/50 ${
              displayTweet.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {displayTweet.media.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt="Tweet media" 
                  className={`w-full object-cover hover:opacity-95 transition-opacity cursor-zoom-in ${
                    displayTweet.media?.length === 3 && i === 0 ? 'row-span-2 h-full' : 'h-64 sm:h-72'
                  }`}
                  onClick={(e) => e.stopPropagation()} 
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-3 -ml-2 max-w-md text-[var(--text-muted)]">
            <button 
              className="flex items-center gap-1 group/btn transition-colors hover:text-[var(--color-chirp)]"
              onClick={(e) => { e.stopPropagation(); navigate(`/tweet/${displayTweet.id}`) }}
            >
              <div className="p-2 rounded-full group-hover/btn:bg-[var(--color-chirp)]/10 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-xs font-medium">{displayTweet.replies_count > 0 ? displayTweet.replies_count : ''}</span>
            </button>

            <button 
              className={`flex items-center gap-1 group/btn transition-colors ${optimisticRetweet ? 'text-green-500' : 'hover:text-green-500'}`}
              onClick={handleRetweet}
            >
              <div className="p-2 rounded-full group-hover/btn:bg-green-500/10 transition-colors">
                <Repeat2 size={18} />
              </div>
              <span className="text-xs font-medium">{retweetsCount > 0 ? retweetsCount : ''}</span>
            </button>

            <button 
              className={`flex items-center gap-1 group/btn transition-colors ${optimisticLike ? 'text-pink-600' : 'hover:text-pink-600'}`}
              onClick={handleLike}
            >
              <div className="p-2 rounded-full group-hover/btn:bg-pink-600/10 transition-colors">
                <motion.div animate={optimisticLike ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Heart size={18} fill={optimisticLike ? "currentColor" : "none"} strokeWidth={optimisticLike ? 0 : 2} />
                </motion.div>
              </div>
              <span className="text-xs font-medium">{likesCount > 0 ? likesCount : ''}</span>
            </button>

            <button 
              className={`flex items-center group/btn transition-colors ${optimisticBookmark ? 'text-[var(--color-chirp)]' : 'hover:text-[var(--color-chirp)]'}`}
              onClick={handleBookmark}
            >
              <div className="p-2 rounded-full group-hover/btn:bg-[var(--color-chirp)]/10 transition-colors">
                <Bookmark size={18} fill={optimisticBookmark ? "currentColor" : "none"} strokeWidth={optimisticBookmark ? 0 : 2} />
              </div>
            </button>

            <button className="flex items-center group/btn hover:text-[var(--color-chirp)] transition-colors" onClick={(e) => e.stopPropagation()}>
              <div className="p-2 rounded-full group-hover/btn:bg-[var(--color-chirp)]/10 transition-colors">
                <Share size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
      <ReportModal 
         isOpen={isReportModalOpen}
         onClose={() => setIsReportModalOpen(false)}
         reportableId={displayTweet.id}
         reportableType="tweet"
      />
    </article>
  );
}
