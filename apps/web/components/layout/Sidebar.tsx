'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FileText,
  PackageCheck,
  Activity,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/' || pathname === '/dashboard',
    },
    {
      label: 'Purchase Orders',
      href: '/purchase-orders',
      icon: FileText,
      active: pathname.startsWith('/purchase-orders'),
    },
    {
      label: 'Vendors',
      href: '/vendors',
      icon: Building2,
      active: pathname.startsWith('/vendors'),
    },
    {
      label: 'Goods Receipts',
      href: '/goods-receipts',
      icon: PackageCheck,
      active: pathname.startsWith('/goods-receipts'),
    },
  ];

  return (
    <aside className={`w-64 bg-[#0d131f] border-r border-slate-800 flex flex-col shrink-0 ${className}`}>
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            W
          </div>
          <div>
            <div className="font-bold text-slate-100 tracking-tight leading-none text-base">WorkWise</div>
            <div className="text-[10px] tracking-wider uppercase font-semibold text-blue-400 mt-0.5">Procurement SaaS</div>
          </div>
        </a>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Procurement Hub
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                item.active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.active ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.active && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
            </a>
          );
        })}
      </div>

      {/* System Status footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0a0f19]">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>API Online</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
