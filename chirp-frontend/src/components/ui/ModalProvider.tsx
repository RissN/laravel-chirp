import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal } from './Modal';
import Button from './Button';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          ...options,
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          variant: options.variant || 'primary',
        },
        resolve,
      });
    });
  }, []);

  const handleClose = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      {modalState && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={handleClose}
          title={modalState.options.title}
        >
          <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">
            {modalState.options.message}
          </p>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="px-6"
            >
              {modalState.options.cancelLabel}
            </Button>
            <Button
              variant={modalState.options.variant === 'danger' ? 'primary' : 'primary'}
              onClick={handleConfirm}
              className={`px-8 ${modalState.options.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {modalState.options.confirmLabel}
            </Button>
          </div>
        </Modal>
      )}
    </ModalContext.Provider>
  );
};
