'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { Charts } from '@/components/dashboard/Charts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { api } from '@/lib/api';
import { Plus, Building2, PackageCheck, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { canEdit } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.dashboard.getMetrics();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <AppLayout
      title="Procurement Operations Dashboard"
      subtitle="Overview of enterprise purchase orders, supplier commitments, and warehouse receipts"
    >
      <div className="space-y-6">
        {/* Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Quick Operations</h2>
            <p className="text-xs text-slate-400">Common procurement workflows</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {canEdit && (
              <>
                <a
                  href="/purchase-orders/new"
                  className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Purchase Order</span>
                </a>
                <a
                  href="/vendors"
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Manage Vendors</span>
                </a>
                <a
                  href="/goods-receipts/new"
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Record GRN</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && !data && (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-xs font-medium">Aggregating live procurement metrics...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchMetrics}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded text-rose-200 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {data && (
          <>
            {/* KPI Cards */}
            <MetricsCards metrics={data.kpis} />

            {/* Charts Grid */}
            <Charts
              monthlyTrend={data.charts.monthlyTrend}
              poByStatus={data.charts.poByStatus}
              vendorsByCategory={data.charts.vendorsByCategory}
            />

            {/* Recent Activity */}
            <RecentActivity activities={data.recentActivity} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
