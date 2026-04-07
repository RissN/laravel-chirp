import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createReport } from '../../api/reports';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportableId: number;
  reportableType: 'tweet' | 'user';
}

const REASONS = [
  'It\'s spam',
  'Hate speech',
  'Harassment or bullying',
  'Misinformation',
  'Violence or physical threats',
  'Self-harm or suicide',
  'Sensitive or disturbing content',
  'Deceptive or impersonation',
  'Something else'
];

export default function ReportModal({ isOpen, onClose, reportableId, reportableType }: ReportModalProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createReport({
      reportable_id: reportableId,
      reportable_type: reportableType,
      reason,
      description: description.trim() || undefined
    }),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      onClose();
      // Reset state for next use
      setReason(REASONS[0]);
      setDescription('');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Report ${reportableType === 'tweet' ? 'Tweet' : 'Account'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
          <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
          <p className="text-xs text-orange-200/80 leading-relaxed font-medium">
            Reports are anonymous and strictly confidential. If the item violates our community 
            guidelines, our moderation team will take appropriate action.
          </p>
        </div>

        <div className="space-y-2 relative">
          <label className="block text-sm font-bold text-[var(--text-color)]">
            Reason for reporting
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-[var(--hover-bg)] border border-[var(--border-color)]/20 rounded-xl px-4 py-3 text-[var(--text-color)] flex items-center justify-between hover:bg-[var(--hover-bg)]/50 transition-all font-medium"
          >
            <span className="text-sm">{reason}</span>
            <ChevronDown size={18} className={`text-white/30 transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-2xl"
                >
                  <div className="max-h-60 overflow-y-auto hide-scrollbar">
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setReason(r);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/10 ${
                          reason === r ? 'text-[var(--color-chirp)] bg-white/[0.05]' : 'text-white/70'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[var(--text-color)]">
            Additional details (Optional)
          </label>
          <textarea
            className="w-full bg-[var(--hover-bg)] border border-[var(--border-color)]/20 rounded-xl px-4 py-3 text-[var(--text-color)] focus:bg-[var(--bg-color)] focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] focus:outline-none transition resize-none text-sm placeholder:text-white/20"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more about the violation..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="px-6">Cancel</Button>
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={mutation.isPending}
            className="px-8 shadow-xl shadow-blue-500/10"
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
