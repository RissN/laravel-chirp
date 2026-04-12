import { useState } from 'react';
import { Search, TrendingUp, UserPlus, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrending } from '../../api/search';
import { getSuggestedUsers, toggleFollowUser } from '../../api/users';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../ui/Avatar';

export default function RightPanel() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending
  });

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: getSuggestedUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes — prevent aggressive refetching
    refetchOnWindowFocus: false,
  });

  const followMutation = useMutation({
    mutationFn: (username: string) => toggleFollowUser(username),
    onMutate: async (username) => {
      // Cancel ongoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['suggestions'] });

      // Snapshot current cache for rollback
      const previousSuggestions = queryClient.getQueryData(['suggestions']);

      // Optimistically update the cache: mark user as followed
      queryClient.setQueryData(['suggestions'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((u: any) =>
            u.username === username ? { ...u, _optimisticFollowed: true } : u
          )
        };
      });

      return { previousSuggestions };
    },
    onError: (_err, _username, context) => {
      // Rollback cache on error
      if (context?.previousSuggestions) {
        queryClient.setQueryData(['suggestions'], context.previousSuggestions);
      }
    },
    onSettled: () => {
      // Refetch after a delay to let the backend settle
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      }, 2000);
    }
  });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Search Bar */}
      <div className="sticky top-0 bg-[var(--bg-color)]/80 backdrop-blur-md pt-1 pb-3 z-30">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={17} className="text-[var(--text-muted)] group-focus-within:text-[var(--color-chirp)] transition-colors duration-200" strokeWidth={2.5} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="block w-full pl-11 pr-4 py-3 bg-[var(--hover-bg)]/50 border border-transparent rounded-2xl text-[14px] text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:bg-[var(--bg-color)] focus:border-[var(--color-chirp)]/50 focus:ring-4 focus:ring-[var(--color-chirp)]/5 transition-all duration-300 outline-none"
            placeholder="Search Chirp"
          />
        </div>
      </div>

      {/* Quick Stats */}
      {user && (
        <div className="glass-card p-5 animate-fade-in-up">
          <h3 className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-[var(--color-chirp)]" />
            Your Activity
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-2xl bg-[var(--hover-bg)]/40 transition-all duration-300 hover:bg-[var(--hover-bg)] group cursor-default border border-transparent hover:border-[var(--border-color)]/10">
              <p className="text-[18px] font-black text-[var(--text-color)] group-hover:scale-110 transition-transform">{user.tweets_count || 0}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">Posts</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-[var(--hover-bg)]/40 transition-all duration-300 hover:bg-[var(--hover-bg)] group cursor-default border border-transparent hover:border-[var(--border-color)]/10">
              <p className="text-[18px] font-black text-[var(--text-color)] group-hover:scale-110 transition-transform">{user.followers_count || 0}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">Followers</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-[var(--hover-bg)]/40 transition-all duration-300 hover:bg-[var(--hover-bg)] group cursor-default border border-transparent hover:border-[var(--border-color)]/10">
              <p className="text-[18px] font-black text-[var(--text-color)] group-hover:scale-110 transition-transform">{user.following_count || 0}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">Following</p>
            </div>
          </div>
        </div>
      )}

      {/* Trending */}
      <div className="glass-card overflow-hidden animate-fade-in-up stagger-1">
        <h2 className="text-[17px] font-black px-5 pt-5 pb-3 text-[var(--text-color)]">
          Trending
        </h2>
        
        <div className="pb-2">
          {trending?.data?.length > 0 ? (
            trending?.data?.slice(0, 5).map((item: any, i: number) => (
              <div 
                key={i} 
                className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--hover-bg)]/50 cursor-pointer transition-all duration-200 group"
                onClick={() => navigate(`/explore?q=${encodeURIComponent('#' + item.name)}`)}
              >
                <div className="rank-badge w-6 h-6 text-[10px]">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-[var(--text-color)] group-hover:text-[var(--color-chirp)] transition-colors truncate">
                    #{item.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">{item.tweets_count} posts</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-sm text-[var(--text-muted)] text-center">
              <TrendingUp size={24} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold opacity-60">Nothing trending yet</p>
              <p className="text-xs mt-1 opacity-40">Be the first to start a topic!</p>
            </div>
          )}
        </div>
      </div>

      {/* Who to Follow */}
      <div className="glass-card overflow-hidden animate-fade-in-up stagger-2">
        <h2 className="text-[17px] font-black px-5 pt-5 pb-3 text-[var(--text-color)]">
          Who to follow
        </h2>
        
        <div className="pb-2">
          {suggestionsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-[var(--color-chirp)]" size={24} />
            </div>
          ) : suggestions?.data && suggestions.data.length > 0 ? (
            suggestions.data.slice(0, 4).map((suggestedUser: any) => (
              <div 
                key={suggestedUser.id} 
                className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--hover-bg)]/50 transition-all duration-200"
              >
                <Avatar name={suggestedUser.name} src={suggestedUser.avatar} size="sm" username={suggestedUser.username} />
                <div className="flex-1 min-w-0 px-1">
                  <Link 
                    to={`/${suggestedUser.username}`}
                    className="font-bold text-[14px] text-[var(--text-color)] hover:underline truncate block"
                  >
                    {suggestedUser.name}
                  </Link>
                  <p className="text-[12px] text-[var(--text-muted)] truncate font-medium">@{suggestedUser.username}</p>
                </div>
                {suggestedUser._optimisticFollowed ? (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="px-4 py-1.5 text-[12px] font-black rounded-full border border-[var(--border-color)]/50 text-[var(--text-color)] transition-all whitespace-nowrap opacity-80 cursor-default"
                  >
                    Following
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); followMutation.mutate(suggestedUser.username); }}
                    disabled={followMutation.isPending && followMutation.variables === suggestedUser.username}
                    className="px-4 py-1.5 text-[12px] font-black rounded-full bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
                  >
                    Follow
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-sm text-[var(--text-muted)] text-center">
              <UserPlus size={24} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold opacity-60">No suggestions</p>
            </div>
          )}
          
          {suggestions?.data && suggestions.data.length > 0 && (
            <Link 
              to="/explore" 
              className="block px-5 py-4 text-[13px] font-bold text-[var(--color-chirp)] hover:bg-[var(--hover-bg)] transition-all duration-200 border-t border-[var(--border-color)]/10 text-center"
            >
              Show more
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 animate-fade-in">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-[var(--text-muted)]/50">
          <span className="hover:underline cursor-pointer transition-colors hover:text-[var(--text-muted)]">About</span>
          <span className="hover:underline cursor-pointer transition-colors hover:text-[var(--text-muted)]">Terms</span>
          <span className="hover:underline cursor-pointer transition-colors hover:text-[var(--text-muted)]">Privacy</span>
          <span className="hover:underline cursor-pointer transition-colors hover:text-[var(--text-muted)]">Cookies</span>
          <span className="hover:underline cursor-pointer transition-colors hover:text-[var(--text-muted)]">Ads info</span>
        </div>
        <p className="text-[10px] text-[var(--text-muted)]/30 mt-3 font-bold tracking-tight">© 2026 CHIRP SOCIAL PLATFORM</p>
      </div>
    </div>
  );
}
