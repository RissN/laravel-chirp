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
        <h1 className="text-2xl font-black text-white">Content Moderation</h1>
        <p className="text-white/40 text-sm mt-1">Review and remove posts that violate community guidelines</p>
      </div>

      {feedback && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm">{feedback}</div>
      )}

      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search post content..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-400" size={24} /></div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-white/30">No posts found</div>
        ) : (
          data?.data?.map((tweet: any) => (
            <div key={tweet.id} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 flex gap-4">
              <img
                src={tweet.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.user?.name ?? 'U')}&background=random`}
                alt={tweet.user?.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">{tweet.user?.name}</span>
                  <span className="text-white/30 text-xs">@{tweet.user?.username}</span>
                  <span className="text-white/20 text-xs">{new Date(tweet.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-white/70 text-sm whitespace-pre-wrap">{tweet.content}</p>
              </div>
              <button
                onClick={() => setConfirmId(tweet.id)}
                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all self-start flex-shrink-0"
                title="Delete post"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-white font-black text-lg mb-2">Delete Post</h2>
            <p className="text-white/50 text-sm mb-6">Are you sure? This post will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-medium transition-all">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmId)}
                disabled={deleteMut.isPending}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
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
