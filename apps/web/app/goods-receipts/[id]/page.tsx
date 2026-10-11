'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import {
  PackageCheck,
  Calendar,
  Truck,
  FileText,
  Building2,
  Printer,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

function GoodsReceiptDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [gr, setGR] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGR = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.goodsReceipts.getById(id);
      setGR(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load goods receipt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGR();
  }, [id]);

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
      <AppLayout title="Goods Receipt Note">
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
          <p className="text-xs">Loading receipt details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !gr) {
    return (
      <AppLayout title="Goods Receipt Note">
        <div className="p-6 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
          {error || 'Goods receipt note not found'}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Goods Receipt Note: ${gr.grNumber}`}
      subtitle={`Received against Purchase Order ${gr.purchaseOrder?.poNumber || ''}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Print Bar */}
        <div className="flex items-center justify-between">
          <a
            href="/goods-receipts"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Goods Receipts</span>
          </a>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Overview Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold font-mono text-teal-400">{gr.grNumber}</span>
                <StatusBadge status={gr.status} type="gr" />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Received by <span className="text-slate-200 font-medium">{gr.receivedBy?.name || 'Warehouse Staff'}</span> on {formatDate(gr.receivedDate)}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400">Associated Order</div>
              <a
                href={`/purchase-orders/${gr.purchaseOrder?.id}`}
                className="text-base font-bold font-mono text-blue-400 hover:text-blue-300 transition-colors"
              >
                {gr.purchaseOrder?.poNumber}
              </a>
              <div className="text-xs text-slate-400 mt-0.5">{gr.purchaseOrder?.title}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-xs">
            {/* Vendor */}
            <div className="space-y-1.5">
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                Supplier
              </div>
              <div className="font-semibold text-slate-200 text-sm">
                {gr.purchaseOrder?.vendor?.name || 'N/A'}
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                {gr.purchaseOrder?.vendor?.code}
              </div>
            </div>

            {/* Carrier Logistics */}
            <div className="space-y-1.5">
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                Carrier & Vehicle
              </div>
              <div className="flex items-center gap-1.5 text-slate-200 font-mono font-medium">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                <span>{gr.vehicleNumber || 'Unspecified Vehicle'}</span>
              </div>
              <div className="text-slate-400">Driver: {gr.driverName || 'N/A'}</div>
            </div>

            {/* Invoicing */}
            <div className="space-y-1.5">
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                Vendor Delivery Note
              </div>
              <div className="text-slate-200 font-mono font-medium">
                {gr.invoiceNumber || 'DC Not Provided'}
              </div>
              {gr.notes && <div className="text-slate-400 italic">"{gr.notes}"</div>}
            </div>
          </div>
        </div>

        {/* Inspected Line Items Table */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Received & Inspected Items</h3>
            <span className="text-xs text-slate-400 font-mono">{gr.lineItems?.length || 0} Items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d131f] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Item Code & Description</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Received Qty</th>
                  <th className="py-3 px-4 text-right">Accepted Qty</th>
                  <th className="py-3 px-4 text-right">Rejected Qty</th>
                  <th className="py-3 px-4">Inspection Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {gr.lineItems?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-100">
                        {item.poLineItem?.description || 'Item'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {item.poLineItem?.itemCode || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {item.poLineItem?.unit || 'Nos'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {Number(item.receivedQty)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {Number(item.acceptedQty)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {Number(item.rejectedQty || 0)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {item.remarks || 'Standard acceptance'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function GoodsReceiptDetailPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0b0f17] flex items-center justify-center text-xs text-slate-400">Loading receipt...</div>}>
      <GoodsReceiptDetailContent />
    </React.Suspense>
  );
}
