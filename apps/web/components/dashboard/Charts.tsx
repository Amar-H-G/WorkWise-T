'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ChartsProps {
  monthlyTrend: Array<{ month: string; count: number; total: number }>;
  poByStatus: Array<{ status: string; count: number; value: number }>;
  vendorsByCategory: Array<{ category: string; count: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function Charts({ monthlyTrend, poByStatus, vendorsByCategory }: ChartsProps) {
  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const statusDisplayNames: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    SENT_TO_VENDOR: 'Sent to Vendor',
    PARTIALLY_RECEIVED: 'Partially Received',
    FULLY_RECEIVED: 'Fully Received',
    CANCELLED: 'Cancelled',
    CLOSED: 'Closed',
  };

  const formattedStatusData = poByStatus.map((item) => ({
    name: statusDisplayNames[item.status] || item.status,
    value: item.count,
    amount: item.value,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 6-Month Spend Trend Area Chart */}
      <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Monthly Procurement Spend</h2>
            <p className="text-xs text-slate-400">Total Purchase Order commitment over past 6 months</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-blue-950/60 text-blue-400 border border-blue-800/60 rounded-full font-medium">
            Trend
          </span>
        </div>
        <div className="h-64 w-full">
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Total Spend']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No trend data available yet
            </div>
          )}
        </div>
      </div>

      {/* PO Status Breakdown Pie/Donut Chart */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-100">PO Status Distribution</h2>
          <p className="text-xs text-slate-400">Current state of active & completed orders</p>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          {formattedStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {formattedStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No orders recorded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
