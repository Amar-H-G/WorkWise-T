'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  PackageCheck,
  Search,
  Plus,
  Loader2,
  Calendar,
  Truck,
  FileText,
  Eye,
} from 'lucide-react';

export default function GoodsReceiptsPage() {
  const { canEdit } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.goodsReceipts.list({
        search: search || undefined,
        status: status || undefined,
      });
      setReceipts(res.data || []);
    } catch (err: any) {
      console.error('Failed to load goods receipts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReceipts();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AppLayout
      title="Goods Receipt Notes (GRN)"
      subtitle="Warehouse receiving, material inspection, batch acceptance, and return tracking"
    >
      <div className="space-y-6">
        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#111827] border border-slate-800 p-4 rounded-xl">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search GRN #, PO #, invoice #, vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg"
            >
              Search
            </button>
          </form>

          {/* Status filter & New GRN button */}
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="INSPECTED">Inspected</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {canEdit && (
              <a
                href="/goods-receipts/new"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-600/20 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record GRN</span>
              </a>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin mb-2" />
              <p className="text-xs">Loading warehouse goods receipts...</p>
            </div>
          ) : receipts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <PackageCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No goods receipts found</p>
              <p className="text-xs text-slate-500 mt-1">Record a goods receipt note for an approved order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d131f] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">GRN Number</th>
                    <th className="py-3 px-4">Associated PO</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Receipt Date</th>
                    <th className="py-3 px-4">Logistics / Vehicle</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {receipts.map((gr) => (
                    <tr key={gr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-400">
                        <a href={`/goods-receipts/${gr.id}`} className="hover:underline">
                          {gr.grNumber}
                        </a>
                      </td>

                      <td className="py-3.5 px-4">
                        <a
                          href={`/purchase-orders/${gr.purchaseOrder?.id}`}
                          className="font-mono text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          {gr.purchaseOrder?.poNumber || 'N/A'}
                        </a>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {gr.purchaseOrder?.title}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-medium">{gr.purchaseOrder?.vendor?.name || 'N/A'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {gr.purchaseOrder?.vendor?.code}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(gr.receivedDate)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3 h-3 text-slate-500" />
                          <span className="font-mono">{gr.vehicleNumber || 'Standard Carrier'}</span>
                        </div>
                        {gr.invoiceNumber && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Inv: {gr.invoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={gr.status} type="gr" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`/goods-receipts/${gr.id}`}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors inline-block"
                          title="View GRN"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
