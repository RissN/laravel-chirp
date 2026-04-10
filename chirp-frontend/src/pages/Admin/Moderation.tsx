import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminTweets, deleteTweet } from '../../api/admin';
import { Search, Trash2, Loader2 } from 'lucide-react';

export default function AdminModeration() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tweets', q],
    queryFn: () => getAdminTweets({ q }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTweet,
    onSuccess: (r) => {
      setFeedback(r.message);
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ['admin-tweets'] });
      setTimeout(() => setFeedback(''), 3000);
    }
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--text-color)]">Content Moderation</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Review and remove posts that violate community guidelines</p>
      </div>

      {feedback && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm">{feedback}</div>
      )}

      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search post content..."
          className="w-full bg-transparent border border-[var(--border-color)]/30 rounded-xl pl-9 pr-4 py-2.5 text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] transition-all"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--color-chirp)]" size={24} /></div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">No posts found</div>
        ) : (
          data?.data?.map((tweet: any) => (
            <div key={tweet.id} className="bg-transparent border border-[var(--border-color)]/30 rounded-2xl p-5 flex gap-4 transition-all hover:bg-[var(--hover-bg)]">
              <img
                src={tweet.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.user?.name ?? 'U')}&background=random`}
                alt={tweet.user?.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[var(--text-color)] font-bold text-sm">{tweet.user?.name}</span>
                  <span className="text-[var(--text-muted)] text-xs">@{tweet.user?.username}</span>
                  <span className="text-[var(--text-muted)] text-xs">{new Date(tweet.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[var(--text-color)] text-sm whitespace-pre-wrap opacity-90">{tweet.content}</p>
              </div>
              <button
                onClick={() => setConfirmId(tweet.id)}
                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all self-start flex-shrink-0"
                title="Delete post"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-start pt-[10vh] justify-center bg-[#242d34]/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-[var(--text-color)] font-black text-lg mb-2">Delete Post</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">Are you sure? This post will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-5 py-2.5 rounded-full border border-[var(--border-color)]/30 bg-transparent text-[var(--text-color)] hover:bg-[var(--hover-bg)] text-sm font-bold transition-all">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmId)}
                disabled={deleteMut.isPending}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {deleteMut.isPending ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
