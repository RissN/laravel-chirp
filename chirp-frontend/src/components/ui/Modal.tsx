import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  contentClassName 
}) => {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[5vh] sm:pt-[10vh] p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#242d34]/70"
      />
      
      <div
        className={`bg-[var(--card-bg)] w-full max-w-[600px] rounded-2xl relative z-10 shadow-xl border border-[var(--border-color)] overflow-hidden ${contentClassName || ''}`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 relative">
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -ml-2 hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--text-color)]"
              >
                <X size={20} />
              </button>
            )}
            {title && <h3 className="text-xl font-bold text-[var(--text-color)]">{title}</h3>}
          </div>
        )}

        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
};
