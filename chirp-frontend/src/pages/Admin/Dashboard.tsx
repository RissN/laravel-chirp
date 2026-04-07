import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../../api/admin';
import { Users, FileText, Flag, ShieldAlert, UserCheck, TrendingUp } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-3xl font-black text-white">{value?.toLocaleString() ?? '—'}</p>
        <p className="text-white/40 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const stats = data?.data?.stats;
  const recentUsers = data?.data?.recent_users ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Platform overview & live statistics</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="animate-spin w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Users" value={stats?.total_users} icon={Users} color="bg-blue-500/20 text-blue-400" />
            <StatCard label="Active Users" value={stats?.active_users} icon={UserCheck} color="bg-green-500/20 text-green-400" />
            <StatCard label="Banned Users" value={stats?.banned_users} icon={ShieldAlert} color="bg-red-500/20 text-red-400" />
            <StatCard label="Total Posts" value={stats?.total_tweets} icon={FileText} color="bg-purple-500/20 text-purple-400" />
            <StatCard label="New This Week" value={stats?.new_users_this_week} icon={TrendingUp} color="bg-cyan-500/20 text-cyan-400" />
            <StatCard label="Pending Reports" value={stats?.pending_reports} icon={Flag} color="bg-orange-500/20 text-orange-400" />
          </div>

          {/* Recent Users */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4">Recent Registrations</h2>
            <div className="space-y-3">
              {recentUsers.map((user: any) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{user.name}</p>
                    <p className="text-white/40 text-xs">@{user.username}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    user.status === 'banned' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
