import { Fragment } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getTimeline } from '../../api/tweets';
import TweetComposer from '../../components/tweet/TweetComposer';
import TweetCard from '../../components/tweet/TweetCard';
import { useAuthStore } from '../../store/authStore';

export default function Home() {
  const { user } = useAuthStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['timeline'],
    queryFn: ({ pageParam = 1 }) => getTimeline(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    }
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div 
      className="h-screen overflow-y-auto hide-scrollbar" 
      onScroll={handleScroll}
    >
      {/* Header Sticky */}
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <h1 className="text-xl font-bold p-4 text-[var(--text-color)] cursor-pointer">
          Home
        </h1>
      </div>

      <TweetComposer />

      {/* Timeline Feed */}
      <div className="pb-20">
        {status === 'pending' ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-[var(--color-chirp)] w-8 h-8" />
          </div>
        ) : status === 'error' ? (
          <div className="p-4 text-center text-red-500">Error loading timeline</div>
        ) : (
          <>
            {data.pages.map((page, i) => (
              <Fragment key={i}>
                {page.data.map((tweet: any) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
              </Fragment>
            ))}
            
            {isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-[var(--color-chirp)] w-6 h-6" />
              </div>
            )}
            
            {!hasNextPage && data.pages[0].data.length > 0 && (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                You have caught up with all tweets.
              </div>
            )}
            
            {data.pages[0].data.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)]">
                Welcome to Chirp! Start following people to see tweets here.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
