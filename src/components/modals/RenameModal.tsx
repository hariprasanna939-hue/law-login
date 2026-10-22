import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LegalDocument } from '../../types';

interface RenameModalProps {
  document: LegalDocument;
  onClose: () => void;
  onSave: (newTitle: string) => Promise<void>;
}

export const RenameModal: React.FC<RenameModalProps> = ({ document, onClose, onSave }) => {
  const [title, setTitle] = useState(document.title);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    setLoading(true);
    try {
      await onSave(title.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <h3 className="font-bold text-zinc-900 text-sm">Rename Document</h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Document Display Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              autoFocus
            />
            {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
            <p className="text-[11px] text-zinc-400 mt-1.5 font-mono truncate">
              Original file: {document.original_filename}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Title'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
