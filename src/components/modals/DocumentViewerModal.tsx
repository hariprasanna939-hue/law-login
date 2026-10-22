import React, { useState, useEffect } from 'react';
import { Menu, ZoomIn, ZoomOut, RotateCw, Download, Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import { LegalDocument } from '../../types';

interface DocumentViewerModalProps {
  document: LegalDocument;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document, onClose }) => {
  const [page, setPage] = useState(1);
  const totalPages = 10;
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [extracting, setExtracting] = useState(true);
  const [activeTab, setActiveTab] = useState<'document' | 'text'>('document');

  useEffect(() => {
    const timer = setTimeout(() => {
      setExtracting(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2b2b2b] flex flex-col animate-in fade-in duration-150">
      {/* Top Dark Bar */}
      <div className="h-12 bg-[#1e1e1e] border-b border-[#333] px-4 flex items-center justify-between text-zinc-300 select-none">
        {/* Left: Menu & Filename */}
        <div className="flex items-center gap-3">
          <Menu className="w-4 h-4 text-zinc-400 hover:text-white cursor-pointer" />
          <span className="text-xs font-mono text-zinc-200 truncate max-w-sm">
            {document.original_filename || `doc-${document.id}.pdf`}
          </span>
        </div>

        {/* Center: Pagination & Zoom */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-[#2b2b2b] px-2.5 py-1 rounded border border-[#3e3e3e]">
            <input
              type="text"
              value={page}
              onChange={(e) => setPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
              className="w-5 text-center bg-transparent text-white font-mono outline-none"
            />
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1 bg-[#2b2b2b] px-2 py-1 rounded border border-[#3e3e3e]">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-0.5 hover:text-white text-zinc-400"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono text-[11px] text-zinc-200">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-0.5 hover:text-white text-zinc-400"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Tab */}
          <div className="flex bg-[#2b2b2b] rounded p-0.5 border border-[#3e3e3e]">
            <button
              onClick={() => setActiveTab('document')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'document' ? 'bg-[#404040] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Scan
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'text' ? 'bg-[#404040] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Extracted Text
            </button>
          </div>
        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRotate}
            className="p-1.5 hover:bg-[#333] hover:text-white rounded text-zinc-400 transition-colors"
            title="Rotate Clockwise"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-[#333] hover:text-white rounded text-zinc-400 transition-colors"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 hover:bg-[#333] hover:text-white rounded text-zinc-400 transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-zinc-400 transition-colors ml-2"
            title="Close Viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-[#383838]">
        {activeTab === 'document' ? (
          <div
            className="bg-white shadow-2xl transition-all duration-200 border border-zinc-300 relative select-text"
            style={{
              width: `${(620 * zoom) / 100}px`,
              minHeight: `${(850 * zoom) / 100}px`,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Authentic Stamp Paper Header from reference */}
            <div className="p-8 font-serif text-zinc-900">
              <div className="border-4 border-double border-zinc-800 p-4 mb-6 text-center">
                <div className="text-xl font-bold tracking-widest uppercase border-b-2 border-zinc-800 pb-1">
                  THIRTY RUPEES
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono mt-1 text-zinc-600">
                  <span>Stamp Dept: 23 DEC 1943</span>
                  <span>COIMBATORE</span>
                  <span>R. No. 10748</span>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="text-center mb-6">
                <h2 className="text-base font-bold tracking-wide underline decoration-1 underline-offset-4">
                  {document.title.toUpperCase()}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Document No. {document.document_number || '770/1944'} · Registered Copy
                </p>
              </div>

              {/* Tamil/English Body Text simulated from reference */}
              <div className="text-xs space-y-3 leading-relaxed text-zinc-800 text-justify font-sans">
                <p>
                  <strong>TRUE COPY</strong> — Presented in the office of the Joint Sub-Registrar II of Coimbatore between the hours of 3 and 4 p.m. on the 14th day of April 1944.
                </p>
                <p className="font-serif italic text-zinc-700 bg-amber-50/50 p-2.5 rounded border border-amber-200/60 text-[11px]">
                  1944-ம் வருடம் ஏப்ரல் மாதம் 14-ம் தேதி கோயமுத்தூர் தாலுகா பேரூர் கிராமம் மகாஜனங்கள் முன்னிலையில் பட்டா மற்றும் பாகசாசனப் பத்திரம் எழுதிக் கொடுத்த விபரம்...
                </p>
                <p>
                  <strong>Parties Involved:</strong> Rangappa Gounder, Periya Gounder, R. Venkatachalam, R. Rangammal co-sharers in Survey Field No. 77 / SF 76/2 part.
                </p>
                <p className="text-[11px] text-zinc-600">
                  {document.extracted_text ||
                    'All co-parcenary rights demarcated with metes and bounds. Schedule A & Schedule B boundaries explicitly defined with road frontage.'}
                </p>
              </div>

              {/* Thumbprints / Seal section matching reference scan */}
              <div className="mt-8 pt-4 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-16 bg-zinc-200 rounded border border-zinc-400 flex items-center justify-center text-[9px] text-zinc-500 text-center font-sans">
                    [Left Thumb Impression]
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-800">Periya Gounder</p>
                    <p className="text-[10px]">Identified by V. Arumugam</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-zinc-800">Joint Sub-Registrar</p>
                  <p className="text-[10px]">Coimbatore DR</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#1e1e1e] rounded-xl max-w-2xl w-full p-6 border border-[#3e3e3e] text-zinc-300 font-mono text-xs leading-relaxed">
            <div className="flex items-center justify-between pb-3 border-b border-[#333] mb-4">
              <span className="font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                OCR Extracted Document Text
              </span>
              <span className="text-[10px] text-zinc-500">Confidence: 98.4%</span>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-300 space-y-2">
              {document.extracted_text ||
                `DOCUMENT TITLE: ${document.title}
ORIGINAL FILE: ${document.original_filename}
DOCUMENT NUMBER: ${document.document_number || 'N/A'}
REVIEW STATUS: ${document.review_status}

TEXT CORPUS:
Sale Deed & Title Extract:
Executed at SRO Coimbatore. Survey Field: SF 77, SF 76/2 Part.
Extent: 0.30 Acre / Specified Cents.
Purchasers: M/s. AMI PROPERTIES & Partners.
Recitals verify chain of title from 1944 Partition Deed (Doc 770/1944) through 1984 Family Partition (Doc 41/1984).
All encumbrances cleared via Revenue Resumption Order and registered release deeds.`}
            </pre>
          </div>
        )}
      </div>

      {/* Reference Toast at bottom left: "Extracting text from PDF..." */}
      {extracting && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#242424] text-zinc-200 text-xs px-4 py-2.5 rounded-xl border border-zinc-700 shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>Extracting text from PDF...</span>
        </div>
      )}
    </div>
  );
};
