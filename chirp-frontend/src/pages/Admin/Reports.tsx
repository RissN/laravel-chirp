import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReports, resolveReport } from '../../api/admin';
import { Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <h1 className="text-2xl font-black text-white">Reports</h1>
        <p className="text-white/40 text-sm mt-1">Review and respond to user complaints</p>
      </div>

      {feedback && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm">{feedback}</div>
      )}

      <div className="flex gap-2 mb-6">
        {['pending', 'reviewed', 'resolved', 'dismissed', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === s ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'text-white/40 hover:bg-white/5'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-400" size={24} /></div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-white/30">No reports found</div>
        ) : (
          data?.data?.map((report: any) => (
            <div key={report.id} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${statusColor[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="text-white/20 text-xs">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white font-bold text-sm">Reason: <span className="text-purple-400">{report.reason}</span></p>
                  {report.description && <p className="text-white/50 text-sm mt-1">{report.description}</p>}
                  <p className="text-white/30 text-xs mt-2">
                    Reported by: @{report.reporter?.username} · Target: {report.reportable_type?.split('\\').pop()} #{report.reportable_id}
                  </p>
                  {report.admin_note && (
                    <p className="mt-2 text-blue-400/70 text-xs italic">Admin note: {report.admin_note}</p>
                  )}
                </div>
                {report.status === 'pending' && (
                  <button
                    onClick={() => { setModal({ report }); setForm({ status: 'resolved', admin_note: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all flex-shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-white font-black text-lg mb-4">Resolve Report</h2>
            <div className="mb-4 relative">
              <label className="block text-white/60 text-sm mb-2">Action</label>
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-white text-sm flex items-center justify-between hover:bg-white/[0.06] transition-all"
              >
                <span>
                  {form.status === 'resolved' ? 'Resolved (action taken)' : 
                   form.status === 'reviewed' ? 'Reviewed (noted)' : 
                   'Dismissed (no violation)'}
                </span>
                <ChevronDown size={14} className={`text-white/30 transform transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isStatusOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[60]" 
                      onClick={() => setIsStatusOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-[70] backdrop-blur-2xl"
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
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                            form.status === opt.value ? 'text-purple-400 bg-white/[0.05]' : 'text-white/70'
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
              <label className="block text-white/60 text-sm mb-2">Admin Note (optional)</label>
              <textarea
                value={form.admin_note}
                onChange={(e) => setForm(prev => ({ ...prev, admin_note: e.target.value }))}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                placeholder="Add a note about this decision..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-medium transition-all">
                Cancel
              </button>
              <button
                onClick={() => resolveMut.mutate({ id: modal.report.id, payload: form })}
                disabled={resolveMut.isPending}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
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
