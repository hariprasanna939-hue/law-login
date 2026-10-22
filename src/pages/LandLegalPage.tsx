import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ChevronDown } from 'lucide-react';
import { Property } from '../types';
import { api } from '../services/api';
import { PropertyDocumentModal } from '../components/modals/PropertyDocumentModal';

export const LandLegalPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [openLegalAiDirectly, setOpenLegalAiDirectly] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await api.getProperties(search, statusFilter);
      setProperties(data);
    } catch (e) {
      console.error('Failed to fetch properties', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleOpenProperty = (property: Property, legalAi: boolean = false) => {
    setSelectedProperty(property);
    setOpenLegalAiDirectly(legalAi);
  };

  const handleTopLegalAi = () => {
    // Open the primary property's legal AI (Perur Enclave or first available)
    if (properties.length > 0) {
      const target = properties.find((p) => p.identifier === 'LND-26-00001') || properties[0];
      handleOpenProperty(target, true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
          LAND — LEGAL DUE DILIGENCE
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Legal Due Diligence
        </h1>
      </div>

      {/* Toolbar / Search & Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or name..."
              className="w-full pl-3.5 pr-4 py-2 rounded-xl border border-zinc-200/90 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 shadow-2xs"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-xl border border-zinc-200/90 bg-white text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs cursor-pointer"
            >
              <option value="All statuses">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Verified">Verified</option>
              <option value="Needs rectification">Needs rectification</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Legal AI button and Land Files Count */}
        <div className="flex flex-col sm:items-end gap-1">
          <button
            onClick={handleTopLegalAi}
            className="self-start sm:self-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Legal AI</span>
          </button>
          <span className="text-[11px] text-zinc-400">
            {properties.length} of {properties.length} land files
          </span>
        </div>
      </div>

      {/* Property Cards Grid (4 columns on desktop) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-zinc-100/70 animate-pulse border border-zinc-200/60" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 rounded-2xl bg-white text-xs text-zinc-400">
          No land properties found matching current criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {properties.map((property) => {
            const hasDocs = property.doc_count > 0;

            return (
              <div
                key={property.id}
                className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Identifier and Open button */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-800">
                      {property.identifier}
                    </span>
                    <button
                      onClick={() => handleOpenProperty(property, false)}
                      className="px-3 py-0.5 rounded-full border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs"
                    >
                      Open
                    </button>
                  </div>

                  {/* Property Name */}
                  <h3 className="font-bold text-zinc-900 text-sm mt-2.5 mb-4 tracking-tight">
                    {property.name}
                  </h3>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 text-xs">
                  <span className="text-zinc-400 text-xs">
                    {property.doc_count} docs
                  </span>

                  {hasDocs && (
                    <>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-medium">
                        {property.verified_count}/{property.doc_count} verified
                      </span>

                      <button
                        onClick={() => handleOpenProperty(property, true)}
                        className="px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                        title="Open Legal AI for this land"
                      >
                        Legal AI
                      </button>
                    </>
                  )}

                  <span className="text-zinc-400 text-[11px] ml-auto">
                    {property.time_in_status || '3d in status'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Property Review Modal */}
      {selectedProperty && (
        <PropertyDocumentModal
          property={selectedProperty}
          onClose={() => {
            setSelectedProperty(null);
            setOpenLegalAiDirectly(false);
          }}
          onPropertyUpdated={fetchProperties}
          initialScrollToAi={openLegalAiDirectly}
        />
      )}
    </div>
  );
};
