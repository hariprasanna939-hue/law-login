import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { LegalDocument } from '../../types';

interface ConfirmDeleteModalProps {
  document: LegalDocument;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  document,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-bold text-zinc-900 text-sm">Delete Document</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Are you sure you want to delete <strong>{document.title}</strong>? This action will archive the legal record and write an audit event.
          </p>

          <div className="flex justify-end gap-2 pt-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
