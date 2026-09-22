import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmText = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-50 text-danger' : 'bg-brand-50 text-brand-600'}`}>
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm text-slate-600 mt-1">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary btn-sm" disabled={loading}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={danger ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}
        >
          {loading ? 'Please wait...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}