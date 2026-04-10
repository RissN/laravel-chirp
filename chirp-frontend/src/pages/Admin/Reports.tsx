import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReports, resolveReport } from '../../api/admin';
import { Loader2, CheckCircle, ChevronDown } from 'lucide-react';

const statusColor: Record<string, string> = {
  pending: 'bg-orange-500/20 text-orange-400',
  reviewed: 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-white/10 text-white/30',
};

export default function AdminReports() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [modal, setModal] = useState<{ report: any } | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [form, setForm] = useState({ status: 'resolved', admin_note: '' });
  const [feedback, setFeedback] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () => getReports({ status: statusFilter }),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, payload }: any) => resolveReport(id, payload),
    onSuccess: (r) => {
      setFeedback(r.message);
      setModal(null);
      setIsStatusOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      setTimeout(() => setFeedback(''), 3000);
    }
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--text-color)]">Reports</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Review and respond to user complaints</p>
      </div>

      {feedback && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm">{feedback}</div>
      )}

      <div className="flex gap-2 mb-6">
        {['pending', 'reviewed', 'resolved', 'dismissed', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              statusFilter === s ? 'bg-[var(--color-chirp)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--color-chirp)]" size={24} /></div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">No reports found</div>
        ) : (
          data?.data?.map((report: any) => (
            <div key={report.id} className="bg-transparent border border-[var(--border-color)]/30 rounded-2xl p-5 hover:bg-[var(--hover-bg)] transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${statusColor[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="text-[var(--text-muted)] text-xs">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[var(--text-color)] font-bold text-sm">Reason: <span className="text-red-400">{report.reason}</span></p>
                  {report.description && <p className="text-[var(--text-color)] opacity-80 text-sm mt-1">{report.description}</p>}
                  <p className="text-[var(--text-muted)] text-xs mt-2">
                    Reported by: @{report.reporter?.username} · Target: {report.reportable_type?.split('\\').pop()} #{report.reportable_id}
                  </p>
                  
                  {report.reportable && (
                    <div className="mt-3 p-3 bg-[var(--hover-bg)]/50 border border-[var(--border-color)]/30 rounded-xl">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Target Details</div>
                      {report.reportable_type?.includes('User') && (
                        <div className="flex items-center gap-3">
                          <img src={report.reportable.avatar || `https://ui-avatars.com/api/?name=${report.reportable.name}&background=random`} alt="" className="w-10 h-10 rounded-full border border-[var(--border-color)]/30" />
                          <div>
                            <div className="text-sm font-bold text-[var(--text-color)]">{report.reportable.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">@{report.reportable.username}</div>
                            {report.reportable.bio && <div className="text-xs text-[var(--text-color)] opacity-60 mt-1 line-clamp-1">{report.reportable.bio}</div>}
                          </div>
                        </div>
                      )}
                      
                      {report.reportable_type?.includes('Tweet') && (
                        <div className="flex items-start gap-3">
                          <img src={report.reportable.user?.avatar || `https://ui-avatars.com/api/?name=${report.reportable.user?.name || 'Unknown'}&background=random`} alt="" className="w-8 h-8 rounded-full border border-[var(--border-color)]/30" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[var(--text-color)] opacity-70">
                               {report.reportable.user?.name || 'Unknown'} <span className="text-[var(--text-muted)] font-normal">@{report.reportable.user?.username || 'unknown'}</span>
                            </div>
                            <div className="text-sm text-[var(--text-color)] mt-1 break-words">{report.reportable.content}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {report.admin_note && (
                    <p className="mt-2 text-blue-400/70 text-xs italic">Admin note: {report.admin_note}</p>
                  )}
                </div>
                {report.status === 'pending' && (
                  <button
                    onClick={() => { setModal({ report }); setForm({ status: 'resolved', admin_note: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-color)]/30 text-[var(--color-chirp)] hover:bg-[var(--hover-bg)] text-sm font-bold transition-all flex-shrink-0"
                  >
                    <CheckCircle size={15} /> Review
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start pt-[10vh] justify-center bg-[#242d34]/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-[var(--text-color)] font-black text-lg mb-4">Resolve Report</h2>
            <div className="mb-4 relative">
              <label className="block text-[var(--text-muted)] text-sm mb-2">Action</label>
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full bg-transparent border border-[var(--border-color)]/30 rounded-xl px-4 py-2.5 text-[var(--text-color)] text-sm flex items-center justify-between hover:bg-[var(--hover-bg)] transition-all"
              >
                <span>
                  {form.status === 'resolved' ? 'Resolved (action taken)' : 
                   form.status === 'reviewed' ? 'Reviewed (noted)' : 
                   'Dismissed (no violation)'}
                </span>
                <ChevronDown size={14} className={`text-[var(--text-muted)] transform transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

                    {isStatusOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[60]" 
                          onClick={() => setIsStatusOpen(false)} 
                        />
                        <div 
                          className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-xl overflow-hidden shadow-2xl z-[70] backdrop-blur-2xl"
                        >
                          {[
                            { label: 'Resolved (action taken)', value: 'resolved' },
                            { label: 'Reviewed (noted)', value: 'reviewed' },
                            { label: 'Dismissed (no violation)', value: 'dismissed' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setForm(prev => ({ ...prev, status: opt.value }));
                                setIsStatusOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--hover-bg)] ${
                                form.status === opt.value ? 'text-[var(--color-chirp)] bg-[var(--hover-bg)]/50' : 'text-[var(--text-color)]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
            </div>
            <div className="mb-6">
              <label className="block text-[var(--text-muted)] text-sm mb-2">Admin Note (optional)</label>
              <textarea
                value={form.admin_note}
                onChange={(e) => setForm(prev => ({ ...prev, admin_note: e.target.value }))}
                rows={3}
                className="w-full bg-transparent border border-[var(--border-color)]/30 rounded-xl px-4 py-3 text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] transition-all resize-none"
                placeholder="Add a note about this decision..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-full border border-[var(--border-color)]/30 bg-transparent text-[var(--text-color)] hover:bg-[var(--hover-bg)] text-sm font-bold transition-all">
                Cancel
              </button>
              <button
                onClick={() => resolveMut.mutate({ id: modal.report.id, payload: form })}
                disabled={resolveMut.isPending}
                className="px-5 py-2.5 rounded-full btn-gradient shadow-lg text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {resolveMut.isPending ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
