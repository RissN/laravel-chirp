import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getTweetDetail } from '../../api/tweets';
import TweetCard from '../../components/tweet/TweetCard';
import TweetComposer from '../../components/tweet/TweetComposer';

export default function TweetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tweetData, isLoading } = useQuery({
    queryKey: ['tweet', id],
    queryFn: () => getTweetDetail(Number(id)),
    enabled: !!id
  });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] p-4 flex gap-6 items-center">
        <ArrowLeft size={20} className="cursor-pointer hover:bg-[var(--hover-bg)] rounded-full transition" onClick={() => navigate(-1)} />
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)] w-8 h-8" /></div>
      ) : tweetData?.data ? (
        <>
          <TweetCard tweet={tweetData.data} />
          <TweetComposer isReply={true} parentId={tweetData.data.id} />
          {/* Mock Replies for now */}
          <div className="p-8 text-center text-[var(--text-muted)]">
            No replies yet. Be the first!
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-[var(--text-muted)]">Tweet not found</div>
      )}
    </div>
  );
}
