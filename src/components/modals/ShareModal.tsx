import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck } from 'lucide-react';
import { LegalDocument } from '../../types';

interface ShareModalProps {
  document: LegalDocument;
  shareUrl: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ document, shareUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-zinc-900 text-sm">Secure Document Share Link</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Authorized token generated for <strong>{document.title}</strong>. This secure link expires in 48 hours and restricts modification permissions.
          </p>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
              Shareable URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-700 outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span>Access Level:</span>
              <span className="font-medium text-zinc-700">Read-Only Document View</span>
            </div>
            <div className="flex justify-between">
              <span>Token Validity:</span>
              <span className="font-medium text-zinc-700">48 Hours</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
