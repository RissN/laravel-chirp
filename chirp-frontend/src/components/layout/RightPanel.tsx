import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTrending } from '../../api/search';

export default function RightPanel() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending
  });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="sticky top-0 bg-[var(--bg-color)] pt-2 pb-3 z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-[var(--text-muted)] group-focus-within:text-[var(--color-chirp)]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="block w-full pl-12 pr-4 py-3 bg-[var(--hover-bg)] border-none rounded-full text-[var(--text-color)] focus:bg-[var(--bg-color)] focus:ring-1 focus:ring-[var(--color-chirp)] focus:outline-none transition"
            placeholder="Search Chirp"
          />
        </div>
      </div>

      {/* Trending Box */}
      <div className="bg-[var(--hover-bg)] rounded-3xl p-4">
        <h2 className="text-xl font-bold mb-4 px-2 text-[var(--text-color)]">What's happening</h2>
        
        <div className="space-y-2">
          {trending?.data?.length > 0 ? (
            trending.data.slice(0, 5).map((item: any, i: number) => (
              <div 
                key={i} 
                className="hover:bg-black/5 dark:hover:bg-white/5 p-3 rounded-2xl cursor-pointer transition"
                onClick={() => navigate(`/explore?q=${encodeURIComponent(item.tag)}`)}
              >
                <p className="text-xs text-[var(--text-muted)]">Trending</p>
                <p className="font-bold text-[var(--text-color)]">#{item.tag}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.count} Tweets</p>
              </div>
            ))
          ) : (
             <div className="px-2 text-[var(--text-muted)]">No trending topics right now.</div>
          )}
        </div>
      </div>
    </div>
  );
}
