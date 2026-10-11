'use client';

import React from 'react';
import { IndianRupee, FileText, Clock, Building2, PackageCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsData {
  totalVendors: number;
  activeVendors: number;
  totalPOs: number;
  activePOs: number;
  pendingApprovalPOs: number;
  totalPOValue: number;
  monthlyPOValue: number;
  poValueChange: number;
  totalGRs: number;
  pendingGRs: number;
}

interface MetricsCardsProps {
  metrics: MetricsData;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cards = [
    {
      title: 'Total Procurement Spend',
      value: formatCurrency(metrics.totalPOValue),
      subtext: `${metrics.poValueChange >= 0 ? '+' : ''}${metrics.poValueChange}% vs last month`,
      icon: IndianRupee,
      trend: metrics.poValueChange >= 0 ? 'up' : 'down',
      accentColor: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
    },
    {
      title: 'Active Purchase Orders',
      value: metrics.activePOs.toString(),
      subtext: `${metrics.totalPOs} total created`,
      icon: FileText,
      trend: 'neutral',
      accentColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Pending Approvals',
      value: metrics.pendingApprovalPOs.toString(),
      subtext: 'Requires managerial review',
      icon: Clock,
      trend: metrics.pendingApprovalPOs > 0 ? 'warning' : 'neutral',
      accentColor: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Active Vendors',
      value: metrics.activeVendors.toString(),
      subtext: `${metrics.totalVendors} registered in system`,
      icon: Building2,
      trend: 'neutral',
      accentColor: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Goods Receipts (GRN)',
      value: metrics.totalGRs.toString(),
      subtext: `${metrics.pendingGRs} awaiting inspection`,
      icon: PackageCheck,
      trend: 'neutral',
      accentColor: 'from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{c.title}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${c.accentColor} border`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">{c.value}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                {c.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                {c.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                <span
                  className={
                    c.trend === 'up'
                      ? 'text-emerald-400'
                      : c.trend === 'down'
                      ? 'text-rose-400'
                      : c.trend === 'warning'
                      ? 'text-amber-400 font-medium'
                      : 'text-slate-400'
                  }
                >
                  {c.subtext}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
