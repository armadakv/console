import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { Button } from '@/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const iconColor = {
    danger: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  }[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 shrink-0 ${iconColor}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'error' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
export { ConfirmDialog };
