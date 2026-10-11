'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  PackageCheck,
  ArrowLeft,
  Truck,
  FileText,
  Calendar,
  Loader2,
  CheckCircle,
} from 'lucide-react';

function NewGRForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPOId = searchParams.get('poId') || '';

  const [eligiblePOs, setEligiblePOs] = useState<any[]>([]);
  const [selectedPOId, setSelectedPOId] = useState(initialPOId);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-MJ-9921');
  const [driverName, setDriverName] = useState('Ramesh Sharma');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('Goods arrived in intact factory packaging. Preliminary verification passed.');

  // Item receipt quantities
  const [items, setItems] = useState<
    Array<{
      poLineItemId: string;
      description: string;
      unit: string;
      orderedQty: number;
      receivedQtySoFar: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      remarks: string;
    }>
  >([]);

  // Load eligible POs
  useEffect(() => {
    async function loadPOs() {
      setLoading(true);
      try {
        const res = await api.purchaseOrders.list({ limit: 50 });
        const eligible = (res.data || []).filter((p: any) =>
          ['APPROVED', 'SENT_TO_VENDOR', 'PARTIALLY_RECEIVED'].includes(p.status)
        );
        setEligiblePOs(eligible);

        const targetId = initialPOId || (eligible.length > 0 ? eligible[0].id : '');
        if (targetId) {
          setSelectedPOId(targetId);
        }
      } catch (err) {
        console.error('Failed to load eligible purchase orders', err);
      } finally {
        setLoading(false);
      }
    }
    loadPOs();
  }, [initialPOId]);

  // When selectedPOId changes, fetch full PO details to load line items
  useEffect(() => {
    async function loadPODetails() {
      if (!selectedPOId) {
        setSelectedPO(null);
        setItems([]);
        return;
      }
      try {
        const poData = await api.purchaseOrders.getById(selectedPOId);
        setSelectedPO(poData);

        const initialItems = (poData.lineItems || []).map((li: any) => {
          const ordered = Number(li.quantity);
          const already = Number(li.receivedQty || 0);
          const remaining = Math.max(0, ordered - already);

          return {
            poLineItemId: li.id,
            description: li.description,
            unit: li.unit,
            orderedQty: ordered,
            receivedQtySoFar: already,
            receivedQty: remaining,
            acceptedQty: remaining,
            rejectedQty: 0,
            remarks: 'Sound condition',
          };
        });
        setItems(initialItems);
      } catch (err) {
        console.error('Failed to fetch PO details', err);
      }
    }
    loadPODetails();
  }, [selectedPOId]);

  const handleQtyChange = (
    index: number,
    field: 'receivedQty' | 'acceptedQty' | 'rejectedQty',
    val: number
  ) => {
    const updated = [...items];
    updated[index][field] = val;
    if (field === 'receivedQty') {
      updated[index].acceptedQty = Math.max(0, val - updated[index].rejectedQty);
    } else if (field === 'acceptedQty') {
      updated[index].rejectedQty = Math.max(0, updated[index].receivedQty - val);
    } else if (field === 'rejectedQty') {
      updated[index].acceptedQty = Math.max(0, updated[index].receivedQty - val);
    }
    setItems(updated);
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    const updated = [...items];
    updated[index].remarks = remarks;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOId) {
      setError('Please select an active purchase order');
      return;
    }
    if (items.some((i) => i.receivedQty < 0 || i.acceptedQty < 0)) {
      setError('Quantities cannot be negative');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        purchaseOrderId: selectedPOId,
        vehicleNumber: vehicleNumber || undefined,
        driverName: driverName || undefined,
        invoiceNumber: invoiceNumber || undefined,
        notes: notes || undefined,
        lineItems: items.map((i) => ({
          poLineItemId: i.poLineItemId,
          receivedQty: Number(i.receivedQty),
          acceptedQty: Number(i.acceptedQty),
          rejectedQty: Number(i.rejectedQty),
          remarks: i.remarks || undefined,
        })),
      };

      const res = await api.goodsReceipts.create(payload);
      router.push(`/goods-receipts/${res.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to record Goods Receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <a
          href="/goods-receipts"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Goods Receipts</span>
        </a>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO & Carrier Info Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-teal-400" />
            <span>Select Purchase Order & Dispatch Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Approved Purchase Order *
              </label>
              {loading ? (
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-500">
                  Loading active orders...
                </div>
              ) : eligiblePOs.length === 0 ? (
                <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-lg text-amber-300">
                  No approved purchase orders ready for goods receipt. Please approve a purchase order first.
                </div>
              ) : (
                <select
                  required
                  value={selectedPOId}
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="">-- Choose Purchase Order --</option>
                  {eligiblePOs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} — {p.title} ({p.vendor?.name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Carrier Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. KA-01-E-1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Driver Name / Carrier</label>
              <input
                type="text"
                placeholder="Driver or transport agent"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Vendor Invoice / DC Number</label>
              <input
                type="text"
                placeholder="e.g. INV-2024-884"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Item Receipt Table Card */}
        {selectedPO && items.length > 0 && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Warehouse Receiving & QA Inspection</h2>
              <p className="text-xs text-slate-400">
                Verify physical item quantities received, accepted, and rejected
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d131f] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-24 text-right">Ordered</th>
                    <th className="py-2.5 px-3 w-24 text-right">Prior Recvd</th>
                    <th className="py-2.5 px-3 w-28 text-right">Received Now *</th>
                    <th className="py-2.5 px-3 w-28 text-right">Accepted *</th>
                    <th className="py-2.5 px-3 w-24 text-right">Rejected</th>
                    <th className="py-2.5 px-3 w-40">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((item, idx) => (
                    <tr key={item.poLineItemId} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-slate-100">{item.description}</td>
                      <td className="py-3 px-3 text-center text-slate-400">{item.unit}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {item.orderedQty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {item.receivedQtySoFar}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.receivedQty}
                          onChange={(e) =>
                            handleQtyChange(idx, 'receivedQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-right font-mono focus:outline-none focus:border-teal-500 font-bold"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.acceptedQty}
                          onChange={(e) =>
                            handleQtyChange(idx, 'acceptedQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-emerald-900/60 rounded px-2 py-1 text-emerald-400 text-right font-mono focus:outline-none focus:border-emerald-500 font-bold"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rejectedQty}
                          onChange={(e) =>
                            handleQtyChange(idx, 'rejectedQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-900 border border-rose-900/60 rounded px-2 py-1 text-rose-400 text-right font-mono focus:outline-none focus:border-rose-500 font-bold"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="Condition / QC notes"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-teal-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/goods-receipts')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedPO || items.length === 0}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Record GRN'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewGoodsReceiptPage() {
  return (
    <AppLayout
      title="Record Goods Receipt Note"
      subtitle="Accept deliveries against purchase orders with item inspection and tracking"
    >
      <Suspense fallback={<div className="text-xs text-slate-400">Loading form...</div>}>
        <NewGRForm />
      </Suspense>
    </AppLayout>
  );
}
