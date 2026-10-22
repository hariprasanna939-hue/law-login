import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Compass, MapPin, Tag, CheckCircle2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Plot, Project } from '../types';
import { api } from '../services/api';
import { useToast } from '../../src/context/ToastContext';

export const AISearchPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [nlQuery, setNlQuery] = useState('');
  const [sizeOperator, setSizeOperator] = useState<'more_than' | 'less_than' | 'equal_to'>('more_than');
  const [sizeValue, setSizeValue] = useState<string>('');
  const [sizeUnit, setSizeUnit] = useState<'cents' | 'sqft' | 'acres'>('cents');
  const [roadWidthFt, setRoadWidthFt] = useState<string>('');

  const [plots, setPlots] = useState<Plot[]>([]);
  const [appliedCriteria, setAppliedCriteria] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    api.getProjects().then((data) => setProjects(data));
    // Initial load with default search
    performSearch();
  }, []);

  const performSearch = async (overrideNl?: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const queryToUse = overrideNl !== undefined ? overrideNl : nlQuery;
      const res = await api.searchPlots({
        projectId: selectedProjectId,
        nlQuery: queryToUse,
        sizeOperator: sizeValue ? sizeOperator : undefined,
        sizeValue: sizeValue ? parseFloat(sizeValue) : undefined,
        sizeUnit,
        roadWidthFt: roadWidthFt ? parseFloat(roadWidthFt) : undefined,
      });
      setPlots(res.plots);
      setAppliedCriteria(res.appliedCriteria);
    } catch (e) {
      showToast('Search query execution failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleQuickSuggestion = (prompt: string) => {
    setNlQuery(prompt);
    performSearch(prompt);
  };

  const handleClearFilters = () => {
    setNlQuery('');
    setSelectedProjectId('all');
    setSizeValue('');
    setRoadWidthFt('');
    performSearch('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
          AI SEARCH
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Search plots in plain language
        </h1>
      </div>

      {/* Main Search Area */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Row 1: Project Selector + Main Input + Search Button */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Project Dropdown */}
          <div className="relative shrink-0 sm:w-64">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full appearance-none px-3.5 py-3 rounded-xl border border-zinc-200/90 bg-white text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs cursor-pointer truncate pr-8"
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Wide Natural Language Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. northeast plots that are available"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200/90 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 shadow-2xs"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Structured Filters Card from reference crop_100s.jpg */}
        <div className="p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Plot Size */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Plot size
              </label>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Operator Dropdown */}
                <div className="relative flex-1 sm:w-36 sm:flex-none min-w-[120px]">
                  <select
                    value={sizeOperator}
                    onChange={(e) => setSizeOperator(e.target.value as any)}
                    className="w-full appearance-none px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs pr-7 cursor-pointer"
                  >
                    <option value="more_than">More than</option>
                    <option value="less_than">Less than</option>
                    <option value="equal_to">Equal to</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Size Value */}
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2"
                  value={sizeValue}
                  onChange={(e) => setSizeValue(e.target.value)}
                  className="w-20 sm:w-24 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                />

                {/* Unit Dropdown */}
                <div className="relative w-24 sm:w-28">
                  <select
                    value={sizeUnit}
                    onChange={(e) => setSizeUnit(e.target.value as any)}
                    className="w-full appearance-none px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs pr-7 cursor-pointer"
                  >
                    <option value="cents">Cents</option>
                    <option value="sqft">Sq.Ft.</option>
                    <option value="acres">Acres</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right: Facing Road Width */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Facing a road of width
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={roadWidthFt}
                  onChange={(e) => setRoadWidthFt(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                />
                <span className="text-xs text-zinc-500 font-medium">feet</span>
              </div>
            </div>
          </div>

          {/* Reference Helper Text */}
          <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              1 cent = 435.6 sq.ft. "Equal to" finds plots within 2% of the size. You can also just type it — "more than 2 cents", "plots facing 30 feet road". A 9 m road counts as 30 feet.
            </p>
            {(nlQuery || sizeValue || roadWidthFt || selectedProjectId !== 'all') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-zinc-500 hover:text-zinc-900 font-medium underline decoration-1 shrink-0 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggested Quick Queries */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Suggested:
        </span>
        <button
          onClick={() => handleQuickSuggestion('northeast plots that are available')}
          className="px-3 py-1 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-700 font-medium transition-colors shadow-2xs"
        >
          northeast plots that are available
        </button>
        <button
          onClick={() => handleQuickSuggestion('more than 2 cents')}
          className="px-3 py-1 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-700 font-medium transition-colors shadow-2xs"
        >
          more than 2 cents
        </button>
        <button
          onClick={() => handleQuickSuggestion('plots facing 30 feet road')}
          className="px-3 py-1 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-700 font-medium transition-colors shadow-2xs"
        >
          plots facing 30 feet road
        </button>
      </div>

      {/* Applied Criteria Chips */}
      {appliedCriteria.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-zinc-500 font-medium">Applied criteria:</span>
          {appliedCriteria.map((crit, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200"
            >
              {crit}
            </span>
          ))}
          <span className="text-zinc-400 text-xs ml-auto">
            {plots.length} matching plot(s)
          </span>
        </div>
      )}

      {/* Plot Search Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-zinc-100/70 animate-pulse border border-zinc-200/60" />
          ))}
        </div>
      ) : plots.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 rounded-2xl bg-white space-y-2">
          <p className="text-sm font-semibold text-zinc-800">No plots found</p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try broadening your natural-language search query or resetting specific size and road width filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((plot) => {
            const isAvail = plot.availability === 'Available';
            const isBooked = plot.availability === 'Booked';

            return (
              <div
                key={plot.id}
                className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top: Plot Number & Availability Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-zinc-900 tracking-tight">
                      {plot.plot_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isAvail
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : isBooked
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                      }`}
                    >
                      {plot.availability}
                    </span>
                  </div>

                  {/* Project Name */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{plot.project_name}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50/80 p-3 rounded-xl border border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Plot Size</span>
                    <span className="font-semibold text-zinc-900">
                      {plot.size_cents} Cents
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      ({plot.size_sqft} sq.ft.)
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Road Width</span>
                    <span className="font-semibold text-zinc-900">
                      {plot.road_width_ft} ft road
                    </span>
                    <span className="text-[10px] text-zinc-500 block font-medium">
                      Facing: {plot.direction}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Approx Value</span>
                    <span className="text-xs font-bold text-zinc-900">
                      ₹{(plot.price_inr / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPlot(plot)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
                  >
                    Open Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plot Detail Modal */}
      {selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">{selectedPlot.plot_number}</h3>
                <p className="text-xs text-zinc-500">{selectedPlot.project_name}</p>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-zinc-400">Dimensions & Extent:</span>
                <span className="font-semibold text-zinc-800">
                  {selectedPlot.size_cents} Cents ({selectedPlot.size_sqft} sq.ft.)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-zinc-400">Road Frontage:</span>
                <span className="font-semibold text-zinc-800">
                  {selectedPlot.road_width_ft} Feet Road
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-zinc-400">Vastu / Orientation:</span>
                <span className="font-semibold text-zinc-800">{selectedPlot.direction}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-zinc-400">Current Availability:</span>
                <span className="font-semibold text-emerald-600">{selectedPlot.availability}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-zinc-400">Estimated Price:</span>
                <span className="font-bold text-zinc-900">
                  ₹{selectedPlot.price_inr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPlot(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
