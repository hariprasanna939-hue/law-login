import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, AlertCircle, FileText, Building2, Clock, Sparkles } from 'lucide-react';
import { DashboardStats, Property } from '../types';
import { api } from '../services/api';
import { PropertyDocumentModal } from '../components/modals/PropertyDocumentModal';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const navigate = useNavigate();

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleOpenProperty = async (propId: string) => {
    try {
      const prop = await api.getProperty(propId);
      setSelectedProperty(prop);
    } catch (e) {
      navigate('/land-legal');
    }
  };

  const verificationPercentage =
    stats && stats.totalDocs > 0
      ? Math.round((stats.verifiedDocs / stats.totalDocs) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
            PORTFOLIO OVERVIEW
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Legal Diligence Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/land-legal')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span>Open Land Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Land Parcels */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Land Parcels</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            {loading ? '-' : stats?.totalProperties || 0}
          </div>
          <p className="text-[11px] text-zinc-400">Across Coimbatore development zones</p>
        </div>

        {/* Total Documents */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Documents</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            {loading ? '-' : stats?.totalDocs || 0}
          </div>
          <p className="text-[11px] text-zinc-400">Title deeds, encumbrances, and orders</p>
        </div>

        {/* Verified Documents Rate */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Verified Rate
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">
              {loading ? '-' : `${verificationPercentage}%`}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              ({stats?.verifiedDocs || 0} verified)
            </span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${verificationPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Needed */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Pending Audit
            </span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">
              {loading ? '-' : stats?.pendingDocs || 0}
            </span>
            <span className="text-xs text-amber-600 font-semibold">
              ({stats?.rectificationDocs || 0} rectification)
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">Requires advocate review</p>
        </div>
      </div>

      {/* Main Grid: Properties Status & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Properties Overview List (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 text-sm tracking-tight">
              Land Properties & Title Clearance Status
            </h3>
            <button
              onClick={() => navigate('/land-legal')}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 underline decoration-1"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {stats?.propertiesSummary.map((prop) => {
              const hasDocs = prop.doc_count > 0;
              const ratio = hasDocs ? (prop.verified_count / prop.doc_count) * 100 : 0;

              return (
                <div
                  key={prop.id}
                  onClick={() => handleOpenProperty(prop.id)}
                  className="p-3.5 rounded-xl border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-zinc-800">
                        {prop.identifier}
                      </span>
                      <span className="text-xs font-bold text-zinc-900">{prop.name}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{prop.location}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-zinc-700 block">
                        {prop.verified_count} / {prop.doc_count} Verified
                      </span>
                      <div className="w-24 bg-zinc-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 bg-white font-medium text-zinc-600">
                      Open
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Trail & Legal Activity (1 Column) */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 text-sm tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Recent Audit Log
            </h3>
          </div>

          <div className="space-y-3.5">
            {stats?.recentAudits && stats.recentAudits.length > 0 ? (
              stats.recentAudits.map((audit) => (
                <div key={audit.id} className="text-xs space-y-1 pb-3 border-b border-zinc-50 last:border-0">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span className="font-semibold text-zinc-700">{audit.actor_name}</span>
                    <span>{new Date(audit.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-zinc-800 font-medium">
                    {audit.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {audit.resource_type}: {audit.resource_id}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic">No recent audit records.</p>
            )}
          </div>
        </div>
      </div>

      {/* Property Review Modal */}
      {selectedProperty && (
        <PropertyDocumentModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onPropertyUpdated={loadStats}
        />
      )}
    </div>
  );
};
