import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, banUser, suspendUser, unbanUser, deleteUser } from '../../api/admin';
import { Search, Ban, UserX, UserCheck, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    suspended: 'bg-yellow-500/20 text-yellow-400',
    banned: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${map[status] ?? 'bg-white/10 text-white/40'}`}>
      {status}
    </span>
  );
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; user: any } | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<number | string>('0'); // 0 means permanent (or null in backend)
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, statusFilter],
    queryFn: () => getAdminUsers({ q, status: statusFilter }),
  });

  const onSuccess = (msg: string) => {
    setFeedback(msg);
    setActionModal(null);
    setReason('');
    setDuration('0');
    setIsDurationOpen(false);
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    setTimeout(() => setFeedback(''), 3000);
  };

  const banMut = useMutation({ mutationFn: ({ id, reason, duration }: any) => banUser(id, reason, duration), onSuccess: (r) => onSuccess(r.message) });
  const suspendMut = useMutation({ mutationFn: ({ id, reason, duration }: any) => suspendUser(id, reason, duration), onSuccess: (r) => onSuccess(r.message) });
  const unbanMut = useMutation({ mutationFn: (id: number) => unbanUser(id), onSuccess: (r) => onSuccess(r.message) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteUser(id), onSuccess: (r) => onSuccess(r.message) });

  const handleAction = () => {
    if (!actionModal) return;
    const { type, user } = actionModal;
    const durationNum = duration === '0' ? undefined : Number(duration);
    
    if (type === 'ban') banMut.mutate({ id: user.id, reason, duration: durationNum });
    if (type === 'suspend') suspendMut.mutate({ id: user.id, reason, duration: durationNum });
    if (type === 'unban') unbanMut.mutate(user.id);
    if (type === 'delete') deleteMut.mutate(user.id);
  };

  const durationOptions = [
    { label: 'Permanent', value: '0' },
    { label: '1 Hour', value: '1' },
    { label: '24 Hours', value: '24' },
    { label: '3 Days', value: '72' },
    { label: '7 Days', value: '168' },
    { label: '30 Days', value: '720' },
  ];

  const selectedDurationLabel = durationOptions.find(o => o.value === duration)?.label;

  const needsReason = actionModal?.type === 'ban' || actionModal?.type === 'suspend';
  const isPending = banMut.isPending || suspendMut.isPending || unbanMut.isPending || deleteMut.isPending;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">User Management</h1>
        <p className="text-white/40 text-sm mt-1">Manage, ban, or remove platform users</p>
      </div>

      {feedback && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm">{feedback}</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
            className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-white text-sm flex items-center gap-2 hover:bg-white/[0.06] transition-all min-w-[140px] justify-between"
          >
            <span className="capitalize">{statusFilter || 'All Status'}</span>
            <ChevronDown size={14} className={`text-white/30 transform transition-transform duration-200 ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isStatusFilterOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60]" 
                  onClick={() => setIsStatusFilterOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-0 mt-2 min-w-[140px] bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-[70] backdrop-blur-2xl"
                >
                  {[
                    { label: 'All Status', value: '' },
                    { label: 'Active', value: 'active' },
                    { label: 'Suspended', value: 'suspended' },
                    { label: 'Banned', value: 'banned' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setIsStatusFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                        statusFilter === opt.value ? 'text-purple-400 bg-white/[0.05]' : 'text-white/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-4 text-white/40 font-medium">User</th>
              <th className="text-left px-6 py-4 text-white/40 font-medium">Email</th>
              <th className="text-left px-6 py-4 text-white/40 font-medium">Status</th>
              <th className="text-left px-6 py-4 text-white/40 font-medium">Joined</th>
              <th className="text-right px-6 py-4 text-white/40 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12"><Loader2 className="animate-spin text-purple-400 mx-auto" size={24} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-white/30">No users found</td></tr>
            ) : (
              data?.data?.map((user: any) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white font-bold">{user.name}</p>
                        <p className="text-white/40 text-xs">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60">{user.email}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4 text-white/40 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {user.status !== 'banned' && (
                        <button
                          onClick={() => setActionModal({ type: 'ban', user })}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          title="Ban"
                        >
                          <Ban size={15} />
                        </button>
                      )}
                      {user.status === 'active' && (
                        <button
                          onClick={() => setActionModal({ type: 'suspend', user })}
                          className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all"
                          title="Suspend"
                        >
                          <UserX size={15} />
                        </button>
                      )}
                      {(user.status === 'banned' || user.status === 'suspended') && (
                        <button
                          onClick={() => setActionModal({ type: 'unban', user })}
                          className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                          title="Reinstate"
                        >
                          <UserCheck size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setActionModal({ type: 'delete', user })}
                        className="p-2 rounded-lg bg-white/10 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-white font-black text-lg mb-2 capitalize">
              {actionModal.type === 'unban' ? 'Reinstate' : actionModal.type} User
            </h2>
            <p className="text-white/50 text-sm mb-6">
              Are you sure you want to {actionModal.type === 'unban' ? 'reinstate' : actionModal.type}{' '}
              <strong className="text-white">@{actionModal.user.username}</strong>?
              {actionModal.type === 'delete' && ' This action is irreversible.'}
            </p>
            {needsReason && (
              <>
                <div className="mb-4 relative">
                  <label className="block text-white/60 text-sm mb-2">Duration</label>
                  <button
                    type="button"
                    onClick={() => setIsDurationOpen(!isDurationOpen)}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-white text-sm flex items-center justify-between hover:bg-white/[0.06] transition-all"
                  >
                    <span>{selectedDurationLabel}</span>
                    <ChevronDown size={14} className={`text-white/30 transform transition-transform duration-200 ${isDurationOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDurationOpen && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[60]" 
                          onClick={() => setIsDurationOpen(false)} 
                        />
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-[70] backdrop-blur-2xl"
                        >
                          {durationOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setDuration(opt.value);
                                setIsDurationOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                                duration === opt.value ? 'text-purple-400 bg-white/[0.05]' : 'text-white/70'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mb-6">
                  <label className="block text-white/60 text-sm mb-2">Reason (required)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                    placeholder="Describe the reason..."
                  />
                </div>
              </>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isPending || (needsReason && !reason.trim())}
                className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                  actionModal.type === 'ban' || actionModal.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-500'
                    : actionModal.type === 'suspend'
                    ? 'bg-yellow-600 hover:bg-yellow-500'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
