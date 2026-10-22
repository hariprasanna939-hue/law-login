import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, Check, AlertCircle, ArrowUpRight, ExternalLink } from 'lucide-react';
import { Property, LegalDocument, LegalAiQuery } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DocumentViewerModal } from './DocumentViewerModal';
import { RenameModal } from './RenameModal';
import { ShareModal } from './ShareModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface PropertyDocumentModalProps {
  property: Property;
  onClose: () => void;
  onPropertyUpdated: () => void;
  initialScrollToAi?: boolean;
}

export const PropertyDocumentModal: React.FC<PropertyDocumentModalProps> = ({
  property,
  onClose,
  onPropertyUpdated,
  initialScrollToAi = false,
}) => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<LegalDocument | null>(null);
  const [docToRename, setDocToRename] = useState<LegalDocument | null>(null);
  const [shareData, setShareData] = useState<{ doc: LegalDocument; url: string } | null>(null);
  const [docToDelete, setDocToDelete] = useState<LegalDocument | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Remarks draft state per document id
  const [draftRemarks, setDraftRemarks] = useState<{ [docId: string]: string }>({});

  // Legal AI State
  const [aiHistory, setAiHistory] = useState<LegalAiQuery[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [askingAi, setAskingAi] = useState(false);

  const { showToast } = useToast();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments(property.id);
      setDocuments(docs);
      const initialRemarks: { [id: string]: string } = {};
      docs.forEach((d) => {
        initialRemarks[d.id] = d.review_comments || '';
      });
      setDraftRemarks(initialRemarks);
    } catch (e) {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAiHistory = async () => {
    try {
      const history = await api.getLegalAiHistory(property.id);
      setAiHistory(history);
    } catch (e) {
      console.error('Failed to load Legal AI history', e);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadAiHistory();
  }, [property.id]);

  useEffect(() => {
    if (initialScrollToAi) {
      setTimeout(() => {
        const el = document.getElementById('legal-ai-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [initialScrollToAi]);

  // Handlers for document actions
  const handleStatusChange = async (
    docId: string,
    newStatus: 'Verified' | 'Needs rectification' | 'Awaiting review'
  ) => {
    try {
      const comment = draftRemarks[docId] || '';
      const updated = await api.updateDocumentStatus(docId, newStatus, comment);
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast(
        newStatus === 'Verified'
          ? 'Document marked Verified ✓'
          : newStatus === 'Needs rectification'
          ? 'Document marked for Rectification'
          : 'Document status updated'
      );
      onPropertyUpdated();
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleRemarksBlur = async (docId: string) => {
    const comment = draftRemarks[docId] || '';
    const current = documents.find((d) => d.id === docId);
    if (current && current.review_comments !== comment) {
      try {
        await api.updateDocumentComments(docId, comment);
      } catch (e) {
        showToast('Failed to save remarks', 'error');
      }
    }
  };

  const handleDownload = (doc: LegalDocument) => {
    window.open(`/api/documents/${doc.id}/download`, '_blank');
  };

  const handleShare = async (doc: LegalDocument) => {
    try {
      const res = await api.createShareLink(doc.id);
      setShareData({ doc, url: res.shareUrl });
    } catch (e) {
      showToast('Failed to create share link', 'error');
    }
  };

  const handleRenameConfirm = async (newTitle: string) => {
    if (!docToRename) return;
    try {
      const updated = await api.renameDocument(docToRename.id, newTitle);
      setDocuments((prev) => prev.map((d) => (d.id === docToRename.id ? updated : d)));
      showToast('Document renamed successfully');
      setDocToRename(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to rename', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    try {
      await api.deleteDocument(docToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      showToast('Document deleted');
      setDocToDelete(null);
      onPropertyUpdated();
    } catch (e) {
      showToast('Failed to delete document', 'error');
    }
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a file to upload', 'warning');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle.trim() || uploadFile.name);

    setUploading(true);
    try {
      const newDoc = await api.uploadDocument(property.id, formData);
      setDocuments((prev) => [...prev, newDoc]);
      setDraftRemarks((prev) => ({ ...prev, [newDoc.id]: '' }));
      setUploadTitle('');
      setUploadFile(null);
      showToast('Document uploaded successfully', 'success');
      onPropertyUpdated();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Legal AI Ask handler
  const handleAskAi = async (customPrompt?: string) => {
    const q = (customPrompt || aiQuestion).trim();
    if (!q) return;

    setAskingAi(true);
    try {
      const result = await api.askLegalAi(property.id, q);
      setAiHistory((prev) => [result, ...prev]);
      setAiQuestion('');
      showToast('Legal AI generated grounded analysis');
    } catch (err: any) {
      showToast(err.message || 'Failed to query Legal AI', 'error');
    } finally {
      setAskingAi(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await api.updatePropertyStatus(property.id, 'Open');
      showToast('Property review status synchronized');
      onPropertyUpdated();
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Centered Modal Container */}
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-zinc-200 shadow-2xl max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur rounded-t-2xl z-10">
          <h2 className="font-bold text-zinc-900 text-sm sm:text-base tracking-tight truncate">
            {property.identifier} · {property.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Metadata Grid from Reference */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block mb-0.5">Current status</span>
              <span className="font-semibold text-zinc-900">{property.current_status}</span>
            </div>
            <div>
              <span className="text-zinc-400 block mb-0.5">Time in status</span>
              <span className="font-semibold text-zinc-900">{property.time_in_status || '3 days'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block mb-0.5">Identified by</span>
              <span className="font-semibold text-zinc-900 truncate block">
                {property.identified_by || 'Broker — Satyaseelan'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block mb-0.5">Documents</span>
              <span className="font-semibold text-zinc-900">{documents.length}</span>
            </div>
          </div>

          {/* Quick Filter Status Buttons from reference */}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
            <button
              onClick={() => {
                // Batch or filter indicator
                showToast(`Filter: ${documents.filter((d) => d.review_status === 'Verified').length} Verified files`);
              }}
              className="px-3 py-1 rounded-lg border border-emerald-500/80 text-emerald-600 text-xs font-medium hover:bg-emerald-50/50 transition-colors"
            >
              Mark verified
            </button>
            <button
              onClick={() => {
                showToast(`Filter: ${documents.filter((d) => d.review_status === 'Needs rectification').length} Rectification files`);
              }}
              className="px-3 py-1 rounded-lg border border-amber-500/80 text-amber-600 text-xs font-medium hover:bg-amber-50/50 transition-colors"
            >
              Needs rectification
            </button>
          </div>

          {/* Section: DOCUMENTS */}
          <div>
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-4">
              DOCUMENTS
            </h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-400">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl p-6">
                No documents currently attached to this property.
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => {
                  const isVerified = doc.review_status === 'Verified';
                  const isRectification = doc.review_status === 'Needs rectification';

                  return (
                    <div
                      key={doc.id}
                      className="border border-zinc-200/90 rounded-2xl p-4 bg-white shadow-2xs hover:border-zinc-300 transition-all space-y-3"
                    >
                      {/* Document Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <h4 className="font-semibold text-zinc-900 text-xs sm:text-sm tracking-tight">
                            {doc.title}
                          </h4>
                          <button
                            onClick={() => setSelectedDocForViewer(doc)}
                            className="text-xs text-zinc-400 hover:text-zinc-600 hover:underline flex items-center gap-1 font-mono truncate text-left"
                            title="Click to view scan"
                          >
                            <span>{doc.original_filename}</span>
                          </button>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isVerified ? (
                            <span className="text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50">
                              Verified
                            </span>
                          ) : isRectification ? (
                            <span className="text-amber-600 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50">
                              Needs rectification
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100">
                              Awaiting review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100/70">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setDocToRename(doc)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleShare(doc)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                          >
                            Share
                          </button>
                        </div>

                        {/* Delete Button (Red) */}
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="px-2.5 py-1 rounded-lg border border-transparent text-red-500 text-xs font-medium hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Review Remarks Textarea */}
                      <div>
                        <textarea
                          rows={2}
                          value={draftRemarks[doc.id] !== undefined ? draftRemarks[doc.id] : doc.review_comments}
                          onChange={(e) =>
                            setDraftRemarks((prev) => ({ ...prev, [doc.id]: e.target.value }))
                          }
                          onBlur={() => handleRemarksBlur(doc.id)}
                          placeholder="Remarks — what you checked, or what needs rectification (required)"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 resize-y"
                        />
                      </div>

                      {/* Audit Stamp & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-zinc-400">
                          {doc.reviewed_at ? (
                            `Last reviewed by ${doc.reviewer_name || 'Admin'} on ${doc.reviewed_at.substring(0, 10)}`
                          ) : (
                            'Not yet reviewed'
                          )}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(doc.id, 'Verified')}
                            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                              isVerified
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : 'border-emerald-500/80 text-emerald-600 hover:bg-emerald-50/60'
                            }`}
                          >
                            <span>Verified ✓</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange(doc.id, 'Needs rectification')}
                            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                              isRectification
                                ? 'bg-amber-50 border-amber-500 text-amber-700'
                                : 'border-amber-500/80 text-amber-600 hover:bg-amber-50/60'
                            }`}
                          >
                            Needs rectification
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Document Upload Area */}
          <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-3">
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              Upload one document at a time — give it its own name (any name; there's no fixed list).
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Document display title (e.g. Sale Deed 1950)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="px-2 py-1.5 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Update Status Button */}
          <div className="pt-2">
            <button
              onClick={handleUpdateStatus}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium transition-colors shadow-2xs"
            >
              Update Status
            </button>
          </div>

          {/* Section: LEGAL AI (Integrated in modal from reference crop_140s.jpg) */}
          <div id="legal-ai-section" className="pt-6 border-t border-zinc-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  LOGIN AI
                </span>
                <span className="text-xs font-semibold text-zinc-800">
                  Ask about these documents
                </span>
              </div>
              <a
                href={`/login-ai?property=${property.id}`}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
              >
                Dedicated Login AI Hub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-400">Not a substitute for legal advice.</p>

            {/* Input Box with Ask button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="What is the name of the purchaser"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              />
              <button
                type="submit"
                disabled={askingAi || !aiQuestion.trim()}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors"
              >
                {askingAi ? 'Asking...' : 'Ask'}
              </button>
            </form>

            {/* Suggestion Quick Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAskAi('Draw the ownership chain of this property as a flow chart, from the earliest document to the current owner, with the document number and date on each step.')}
                className="px-3 py-1 rounded-full border border-zinc-200 hover:border-zinc-300 text-[11px] text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
              >
                Build ownership chain flow chart
              </button>
              <button
                type="button"
                onClick={() => handleAskAi('What is the name of the purchaser in the registered sale deeds?')}
                className="px-3 py-1 rounded-full border border-zinc-200 hover:border-zinc-300 text-[11px] text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
              >
                Check purchaser names
              </button>
              <button
                type="button"
                onClick={() => handleAskAi('Are there any missing legal documents or unverified heirship records?')}
                className="px-3 py-1 rounded-full border border-zinc-200 hover:border-zinc-300 text-[11px] text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
              >
                Identify missing legal records
              </button>
            </div>

            {/* History Section */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                HISTORY ({aiHistory.length})
              </h4>

              {aiHistory.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No previous questions asked for this property.</p>
              ) : (
                <div className="space-y-4">
                  {aiHistory.map((item) => (
                    <div
                      key={item.id}
                      className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-zinc-900 leading-snug">
                          {item.question}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                          {item.date_label || '22 Oct'}
                        </span>
                      </div>

                      {/* Formatted Markdown-like Legal Answer */}
                      <div className="text-xs text-zinc-700 leading-relaxed space-y-2 overflow-x-auto">
                        <div
                          className="prose prose-xs max-w-none text-zinc-700 text-xs font-sans leading-relaxed [&>table]:w-full [&>table]:border-collapse [&>table]:my-2 [&>table]:border [&>table]:border-zinc-200 [&_th]:bg-zinc-100 [&_th]:border [&_th]:border-zinc-200 [&_th]:p-2 [&_th]:text-left [&_th]:text-[11px] [&_td]:border [&_td]:border-zinc-200 [&_td]:p-2 [&_td]:text-[11px] [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50/70 [&_blockquote]:p-2.5 [&_blockquote]:my-2 [&_blockquote]:rounded [&_blockquote]:text-[11px] [&_blockquote]:text-zinc-800"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdownText(item.answer),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Modals */}
      {selectedDocForViewer && (
        <DocumentViewerModal
          document={selectedDocForViewer}
          onClose={() => setSelectedDocForViewer(null)}
        />
      )}

      {docToRename && (
        <RenameModal
          document={docToRename}
          onClose={() => setDocToRename(null)}
          onSave={handleRenameConfirm}
        />
      )}

      {shareData && (
        <ShareModal
          document={shareData.doc}
          shareUrl={shareData.url}
          onClose={() => setShareData(null)}
        />
      )}

      {docToDelete && (
        <ConfirmDeleteModal
          document={docToDelete}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

// Simple Markdown table and blockquote parser for legal responses
function renderMarkdownText(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headings
    .replace(/^### (.*$)/gim, '<h4 class="font-bold text-zinc-900 text-xs mt-2 mb-1">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="font-bold text-zinc-900 text-sm mt-3 mb-1.5">$1</h3>');

  // Convert Blockquotes (> Note...)
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Convert Tables
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml = '<div class="overflow-x-auto my-2"><table class="w-full text-[11px] border border-zinc-200 rounded">';
      }

      if (line.includes('---')) {
        // Separator line
        continue;
      }

      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      // If first row, render header
      if (!tableHtml.includes('<tbody>') && !tableHtml.includes('<thead>')) {
        tableHtml += '<thead><tr>';
        cells.forEach((c) => (tableHtml += `<th class="p-2 border border-zinc-200 bg-zinc-100 font-semibold">${c}</th>`));
        tableHtml += '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>';
        cells.forEach((c) => (tableHtml += `<td class="p-2 border border-zinc-200">${c}</td>`));
        tableHtml += '</tr>';
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHtml += '</tbody></table></div>';
        resultLines.push(tableHtml);
        tableHtml = '';
      }
      resultLines.push(line ? `<p class="my-1">${line}</p>` : '');
    }
  }

  if (inTable) {
    tableHtml += '</tbody></table></div>';
    resultLines.push(tableHtml);
  }

  return resultLines.join('\n');
}
