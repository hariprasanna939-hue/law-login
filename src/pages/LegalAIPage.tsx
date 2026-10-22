import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  FileText,
  ShieldCheck,
  AlertTriangle,
  History,
  Copy,
  Check,
  ChevronDown,
  Building2,
  ExternalLink,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Property, LegalDocument } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { DocumentViewerModal } from '../components/modals/DocumentViewerModal';

interface QueryRecord {
  id: string;
  property_id: string;
  user_name: string;
  question: string;
  answer: string;
  date_label: string;
  created_at: string;
}

export const LegalAIPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [history, setHistory] = useState<QueryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<LegalDocument | null>(null);

  // Load properties on mount
  useEffect(() => {
    const loadProps = async () => {
      try {
        const list = await api.getProperties();
        setProperties(list);
        const urlProp = searchParams.get('property');
        if (urlProp && list.some((p) => p.id === urlProp)) {
          setSelectedPropertyId(urlProp);
        } else if (list.length > 0) {
          setSelectedPropertyId(list[0].id);
        }
      } catch (e) {
        showToast('Failed to load properties', 'error');
      }
    };
    loadProps();
  }, []);

  // When selectedPropertyId changes, load its documents & history
  useEffect(() => {
    if (!selectedPropertyId) return;

    setSearchParams({ property: selectedPropertyId });

    const loadData = async () => {
      setLoadingDocs(true);
      setLoadingHistory(true);
      try {
        const [docs, hist] = await Promise.all([
          api.getDocuments(selectedPropertyId),
          api.getLegalAiHistory(selectedPropertyId),
        ]);
        setDocuments(docs);
        setHistory(hist);
      } catch (e) {
        console.error('Failed to load property details', e);
      } finally {
        setLoadingDocs(false);
        setLoadingHistory(false);
      }
    };

    loadData();
  }, [selectedPropertyId]);

  const activeProperty = properties.find((p) => p.id === selectedPropertyId);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || !selectedPropertyId) return;

    setAsking(true);
    try {
      const result = await api.askLegalAi(selectedPropertyId, q);
      setHistory((prev) => [result, ...prev]);
      setQuestion('');
      showToast('Legal analysis complete', 'success');
    } catch (e: any) {
      showToast(e.message || 'Legal AI query failed', 'error');
    } finally {
      setAsking(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptCategories = [
    {
      label: 'Title Chain & Lineage',
      query:
        'Draw the ownership chain of this property as a flow chart, from the earliest document to the current owner, with the document number and date on each step.',
    },
    {
      label: 'Purchasers & Powers',
      query: 'What is the name of the purchaser and authorized GPA agent in the registered deeds?',
    },
    {
      label: 'Succession & Legal Heirs',
      query: 'Are there any missing legal documents, succession issues, or unverified heirship records?',
    },
    {
      label: 'Nil Encumbrance (EC)',
      query: 'Summarize the encumbrance certificates from 1975 to current date and identify any charges or liens.',
    },
    {
      label: 'DTCP & Layout Sanction',
      query: 'Verify DTCP approval order, panchayat sanction, and road handover gift deeds.',
    },
    {
      label: 'Revenue, Patta & FMB',
      query: 'Review the computerized patta passbook, FMB survey boundaries, village adangal, and inam conversion.',
    },
    {
      label: 'Financial & Bank NOC',
      query: 'Check bank clearance certificate, mortgage status, and whether the title is clear of loan liabilities.',
    },
    {
      label: 'Document Audit Summary',
      query: 'List all verified records versus documents needing rectification or awaiting advocate clearance.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
              DUE DILIGENCE INTELLIGENCE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Legal AI
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Legal AI Intelligence Hub
          </h1>
          <p className="text-xs text-zinc-500">
            Automated legal title auditing grounded in registered Bagasasanam, partition deeds, sale deeds, nil encumbrance certificates, and revenue extracts.
          </p>
        </div>

        {/* Property Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Select Property File
            </label>
            <div className="relative">
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="appearance-none pl-3.5 pr-9 py-2 rounded-xl border border-zinc-200/90 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs cursor-pointer min-w-[240px]"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.identifier})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Property Overview Ribbon */}
      {activeProperty && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">{activeProperty.name}</h3>
                <span className="text-[11px] font-mono font-medium text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">
                  {activeProperty.identifier}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{activeProperty.location} • Identified by {activeProperty.identified_by}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-medium text-zinc-700">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                <strong>{documents.length}</strong> indexed records
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {documents.filter((d) => d.review_status === 'Verified').length} verified
              </span>
            </div>
            <button
              onClick={() => navigate('/land-legal')}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
            >
              Open Deeds <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Query & Response on Left, Indexed Evidence on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input + Conversation Timeline (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Query Input Card */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-zinc-900" /> Ask Due Diligence Question
              </span>
              <span className="text-[11px] text-zinc-400">Not a substitute for formal legal opinion</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Draw the ownership chain flow chart, or check purchaser names..."
                disabled={asking}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200/90 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 shadow-2xs"
              />
              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-2xs"
              >
                {asking ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Ask
                  </>
                )}
              </button>
            </form>

            {/* Quick Action Suggestion Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Recommended Due Diligence Inquiries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {promptCategories.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(p.query)}
                    disabled={asking}
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50/70 hover:bg-zinc-100/70 text-[11px] text-zinc-700 font-medium transition-colors text-left disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inquiry History Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Legal Analysis Timeline ({history.length})
              </h3>
              {history.length > 0 && (
                <span className="text-[11px] text-zinc-400">Grounded in verified property file records</span>
              )}
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-zinc-400 animate-pulse">
                Loading legal inquiry records...
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-8 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-zinc-700">No questions asked yet for this property</p>
                <p className="text-[11px] text-zinc-400">
                  Select any prompt chip above or type a custom question to extract title chain and recitals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-3 transition-all hover:border-zinc-300"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Inquiry
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                          {item.question}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-400 font-medium bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded">
                          {item.date_label || '22 Oct'}
                        </span>
                        <button
                          onClick={() => handleCopy(item.answer, item.id)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                          title="Copy answer"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Grounded Response Content */}
                    <div className="text-xs text-zinc-700 leading-relaxed overflow-x-auto">
                      <div
                        className="prose prose-xs max-w-none text-zinc-700 text-xs font-sans leading-relaxed [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>table]:border [&>table]:border-zinc-200 [&_th]:bg-zinc-100 [&_th]:border [&_th]:border-zinc-200 [&_th]:p-2.5 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_td]:border [&_td]:border-zinc-200 [&_td]:p-2.5 [&_td]:text-[11px] [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50/70 [&_blockquote]:p-3 [&_blockquote]:my-3 [&_blockquote]:rounded-r-lg [&_blockquote]:text-[11px] [&_blockquote]:text-zinc-800"
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

        {/* Right Column: Indexed Deeds Grounding the Assistant (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-700" /> Grounding Deeds & Records
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">
                {documents.length} files
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              These registered legal instruments ground the responses. Click any deed to inspect the high-resolution scanned document.
            </p>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {loadingDocs ? (
                <div className="py-6 text-center text-xs text-zinc-400">Loading indexed records...</div>
              ) : documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400 italic">No legal deeds in this file</div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setViewerDoc(doc)}
                    className="p-2.5 rounded-xl border border-zinc-200/80 hover:border-zinc-400 bg-zinc-50/50 hover:bg-white cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[11px] font-bold text-zinc-800 group-hover:text-zinc-950 line-clamp-1">
                        {doc.title}
                      </h4>
                      <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 shrink-0 mt-0.5" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="truncate max-w-[150px]">{doc.original_filename}</span>
                      <span
                        className={`font-semibold ${
                          doc.review_status === 'Verified'
                            ? 'text-emerald-600'
                            : doc.review_status === 'Needs rectification'
                            ? 'text-amber-600'
                            : 'text-zinc-500'
                        }`}
                      >
                        {doc.review_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Scan Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          document={viewerDoc}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </div>
  );
};

// Markdown table, blockquote, and emphasis parser for legal responses
function renderMarkdownText(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headings
    .replace(/^### (.*$)/gim, '<h4 class="font-bold text-zinc-900 text-xs mt-3 mb-1.5">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="font-bold text-zinc-900 text-sm mt-3 mb-2">$1</h3>');

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
        tableHtml = '<div class="overflow-x-auto my-2.5"><table class="w-full text-[11px] border border-zinc-200 rounded-lg">';
      }

      if (line.includes('---')) {
        continue;
      }

      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      if (!tableHtml.includes('<tbody>') && !tableHtml.includes('<thead>')) {
        tableHtml += '<thead><tr>';
        cells.forEach((c) => (tableHtml += `<th class="p-2.5 border border-zinc-200 bg-zinc-100 font-semibold text-zinc-900">${c}</th>`));
        tableHtml += '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>';
        cells.forEach((c) => (tableHtml += `<td class="p-2.5 border border-zinc-200 bg-white">${c}</td>`));
        tableHtml += '</tr>';
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHtml += '</tbody></table></div>';
        resultLines.push(tableHtml);
        tableHtml = '';
      }
      resultLines.push(line);
    }
  }

  if (inTable) {
    tableHtml += '</tbody></table></div>';
    resultLines.push(tableHtml);
  }

  return resultLines.join('\n').replace(/\n/g, '<br/>').replace(/<br\/><div/g, '<div').replace(/<\/div><br\/>/g, '</div>');
}
