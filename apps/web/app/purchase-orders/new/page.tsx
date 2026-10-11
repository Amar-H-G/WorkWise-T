'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';

interface LineItem {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [vendorId, setVendorId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('Bengaluru Central Hub, Industrial Area 4');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('Payment within 30 days of GRN confirmation. All goods subject to QA inspection.');
  const [terms, setTerms] = useState('Standard industrial procurement terms apply.');

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      itemCode: 'ELEC-001',
      description: 'Industrial Circuit Breaker 63A 4-Pole',
      unit: 'Nos',
      quantity: 10,
      unitPrice: 4500,
      taxPercent: 18,
    },
    {
      itemCode: 'CAB-002',
      description: 'Heavy Duty Armoured Copper Cable 16 sq mm',
      unit: 'Mtrs',
      quantity: 100,
      unitPrice: 320,
      taxPercent: 18,
    },
  ]);

  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await api.vendors.list({ limit: 100, status: 'ACTIVE' });
        setVendors(res.data || []);
        if (res.data?.length > 0) {
          setVendorId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load vendors:', err);
      } finally {
        setLoadingVendors(false);
      }
    }
    loadVendors();
  }, []);

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      {
        itemCode: '',
        description: '',
        unit: 'Nos',
        quantity: 1,
        unitPrice: 0,
        taxPercent: 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    lineItems.forEach((item) => {
      const lineSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const lineTax = (lineSubtotal * (Number(item.taxPercent) || 0)) / 100;
      subtotal += lineSubtotal;
      taxAmount += lineTax;
    });
    return {
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
    };
  };

  const totals = calculateTotals();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setError('Please select a supplier');
      return;
    }
    if (lineItems.some((i) => !i.description.trim() || Number(i.quantity) <= 0)) {
      setError('Please ensure all items have a description and quantity greater than 0');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        vendorId,
        title,
        description: description || undefined,
        deliveryAddress: deliveryAddress || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        notes: notes || undefined,
        terms: terms || undefined,
        lineItems: lineItems.map((item, idx) => ({
          itemCode: item.itemCode || undefined,
          description: item.description,
          unit: item.unit || 'Nos',
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxPercent: Number(item.taxPercent),
          sortOrder: idx,
        })),
      };

      const res = await api.purchaseOrders.create(payload);
      router.push(`/purchase-orders/${res.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Create Purchase Order"
      subtitle="Issue a new industrial procurement commitment with dynamic multi-line items"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <a
            href="/purchase-orders"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </a>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Details Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Purchase Order Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Supplier / Vendor *</label>
                {loadingVendors ? (
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-500">
                    Loading vendors...
                  </div>
                ) : (
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Active Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.code} - {v.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">PO Title / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Substation Switchgear Procurement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Delivery Destination</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Warehouse / Site Address"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Line Items</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {lineItems.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Specify quantities, rates, and GST percentage</p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d131f] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Item Code</th>
                    <th className="py-2.5 px-3">Description *</th>
                    <th className="py-2.5 px-3 w-20">Unit</th>
                    <th className="py-2.5 px-3 w-24">Qty</th>
                    <th className="py-2.5 px-3 w-28">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 w-20">GST %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lineItems.map((item, idx) => {
                    const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    const itemTotal = itemSubtotal + (itemSubtotal * (Number(item.taxPercent) || 0)) / 100;

                    return (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="CODE"
                            value={item.itemCode}
                            onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            placeholder="Material / Service description"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs text-center focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs text-right font-mono focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs text-right font-mono focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.taxPercent}
                            onChange={(e) => handleItemChange(idx, 'taxPercent', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs text-center focus:outline-none focus:border-blue-500"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                          {formatCurrency(itemTotal)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={lineItems.length === 1}
                            className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-slate-800 flex flex-col items-end text-xs space-y-1.5 font-medium">
              <div className="flex justify-between w-64 text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-400">
                <span>Total GST / Taxes:</span>
                <span className="font-mono text-slate-200">{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-slate-800 text-slate-100 font-bold text-sm">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Notes Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-100">Terms & Special Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Commercial Terms</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/purchase-orders')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Purchase Order (Draft)'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
