'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  FileText,
  Building2,
  Calendar,
  CheckCircle,
  Send,
  XCircle,
  PackageCheck,
  Printer,
  ArrowLeft,
  Loader2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

function PurchaseOrderDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isManager, isAdmin, canEdit } = useAuth();

  const [po, setPO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPO = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.purchaseOrders.getById(id);
      setPO(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
  }, [id]);

  const handleAction = async (action: 'approve' | 'send' | 'cancel' | 'close') => {
    if (!confirm(`Are you sure you want to perform action: ${action.toUpperCase()}?`)) return;
    setActionLoading(action);
    try {
      await api.purchaseOrders.updateStatus(id, action);
      fetchPO();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || `Failed to ${action} order`);
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout title="Purchase Order">
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-xs">Loading order details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !po) {
    return (
      <AppLayout title="Purchase Order">
        <div className="p-6 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
          {error || 'Purchase order not found'}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Purchase Order: ${po.poNumber}`}
      subtitle={`${po.title} • Created by ${po.createdBy?.name || 'User'}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Status Workflow Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <a
            href="/purchase-orders"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders List</span>
          </a>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Order</span>
            </button>

            {/* Approval Action */}
            {(isManager || isAdmin) && (po.status === 'PENDING_APPROVAL' || po.status === 'DRAFT') && (
              <button
                onClick={() => handleAction('approve')}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {actionLoading === 'approve' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Approve Order</span>
              </button>
            )}

            {/* Dispatch Action */}
            {canEdit && po.status === 'APPROVED' && (
              <button
                onClick={() => handleAction('send')}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {actionLoading === 'send' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send to Vendor</span>
              </button>
            )}

            {/* Goods Receipt Link */}
            {canEdit && (po.status === 'SENT_TO_VENDOR' || po.status === 'PARTIALLY_RECEIVED') && (
              <a
                href={`/goods-receipts/new?poId=${po.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-600/20 transition-all"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Receive Goods (GRN)</span>
              </a>
            )}

            {/* Cancel Action */}
            {canEdit && !['CANCELLED', 'CLOSED', 'FULLY_RECEIVED'].includes(po.status) && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* PO Overview Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold font-mono text-slate-100">{po.poNumber}</span>
                <StatusBadge status={po.status} type="po" />
              </div>
              <h2 className="text-base font-semibold text-slate-200 mt-1">{po.title}</h2>
              {po.description && <p className="text-xs text-slate-400 mt-1">{po.description}</p>}
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400">Total Commitment</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(po.totalAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Subtotal: {formatCurrency(po.subtotal)} | Tax: {formatCurrency(po.taxAmount)}
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-xs">
            {/* Vendor Details */}
            <div className="space-y-1.5">
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                Vendor Details
              </div>
              <div className="font-semibold text-slate-200 text-sm">{po.vendor?.name}</div>
              <div className="text-slate-400 font-mono text-[11px]">{po.vendor?.code} • {po.vendor?.category}</div>
              <div className="text-slate-400">{po.vendor?.email}</div>
              <div className="text-slate-400">{po.vendor?.city}, {po.vendor?.state}</div>
            </div>

            {/* Delivery Info */}
            <div className="space-y-1.5">
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                Logistics & Destination
              </div>
              <div className="text-slate-300 font-medium">{po.deliveryAddress || 'Standard Warehouse Hub'}</div>
              <div className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Delivery By: {formatDate(po.deliveryDate)}</span>
              </div>
            </div>

            {/* Audit info */}
            <div className="space-y-1.5">
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                Audit Timeline
              </div>
              <div className="text-slate-400">Created: <span className="text-slate-300">{formatDate(po.createdAt)}</span> by {po.createdBy?.name}</div>
              {po.approvedAt && (
                <div className="text-slate-400">Approved: <span className="text-emerald-400">{formatDate(po.approvedAt)}</span> by {po.approvedBy?.name}</div>
              )}
              {po.sentAt && (
                <div className="text-slate-400">Sent: <span className="text-blue-400">{formatDate(po.sentAt)}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Procured Line Items</h3>
            <span className="text-xs text-slate-400 font-mono">{po.lineItems?.length || 0} Items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d131f] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Ordered</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Unit Rate</th>
                  <th className="py-3 px-4 text-center">GST %</th>
                  <th className="py-3 px-4 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {po.lineItems?.map((item: any) => {
                  const ordered = Number(item.quantity);
                  const received = Number(item.receivedQty || 0);
                  const percentReceived = Math.min(100, Math.round((received / ordered) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {item.itemCode || '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-100">{item.description}</td>
                      <td className="py-3 px-4 text-center text-slate-400">{item.unit}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">{ordered}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono font-semibold ${
                              received >= ordered ? 'text-emerald-400' : received > 0 ? 'text-amber-400' : 'text-slate-500'
                            }`}
                          >
                            {received}
                          </span>
                          <span className="text-[10px] text-slate-500">{percentReceived}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {item.taxPercent}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Goods Receipts Associated with this PO */}
        {po.goodsReceipts && po.goodsReceipts.length > 0 && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-teal-400" />
              <span>Goods Receipts (GRN) Issued Against This Order</span>
            </h3>

            <div className="divide-y divide-slate-800/80">
              {po.goodsReceipts.map((gr: any) => (
                <div key={gr.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-blue-400">{gr.grNumber}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Received {formatDate(gr.receivedDate)} • Vehicle: {gr.vehicleNumber || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={gr.status} type="gr" />
                    <a
                      href={`/goods-receipts/${gr.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-medium"
                    >
                      View GRN
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function PurchaseOrderDetailPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0b0f17] flex items-center justify-center text-xs text-slate-400">Loading order details...</div>}>
      <PurchaseOrderDetailContent />
    </React.Suspense>
  );
}
