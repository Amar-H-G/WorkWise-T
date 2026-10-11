'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  FileText,
  Search,
  Plus,
  Loader2,
  CheckCircle,
  Eye,
  Calendar,
  Building2,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';

export default function PurchaseOrdersPage() {
  const { canEdit, isManager, isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.purchaseOrders.list({
        search: search || undefined,
        status: status || undefined,
      });
      setOrders(res.data || []);
    } catch (err: any) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleQuickApprove = async (id: string, poNumber: string) => {
    if (!confirm(`Confirm approval for purchase order ${poNumber}?`)) return;
    setActionLoading(id);
    try {
      await api.purchaseOrders.updateStatus(id, 'approve');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to approve order');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Sent to Vendor', value: 'SENT_TO_VENDOR' },
    { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
    { label: 'Fully Received', value: 'FULLY_RECEIVED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <AppLayout
      title="Purchase Orders"
      subtitle="Lifecycle tracking, approvals, line items, and fulfillment monitoring"
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
                placeholder="Search by PO Number, title, or vendor..."
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

          {/* Status filter & New PO button */}
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {canEdit && (
              <a
                href="/purchase-orders/new"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Purchase Order</span>
              </a>
            )}
          </div>
        </div>

        {/* PO Table */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
              <p className="text-xs">Fetching purchase orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No purchase orders found</p>
              <p className="text-xs text-slate-500 mt-1">Create a purchase order or adjust filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d131f] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">PO Number & Title</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <a
                              href={`/purchase-orders/${po.id}`}
                              className="font-bold text-blue-400 hover:text-blue-300 font-mono text-xs transition-colors"
                            >
                              {po.poNumber}
                            </a>
                            <div className="text-slate-300 font-medium text-xs truncate max-w-xs mt-0.5">
                              {po.title}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-medium">{po.vendor?.name || 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{po.vendor?.code}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(po.createdAt)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100 font-mono">
                        {formatCurrency(po.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={po.status} type="po" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(isManager || isAdmin) && po.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => handleQuickApprove(po.id, po.poNumber)}
                              disabled={actionLoading === po.id}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded font-semibold text-[11px] flex items-center gap-1 transition-all"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          <a
                            href={`/purchase-orders/${po.id}`}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
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
