'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LogOut, User as UserIcon, Bell, Search } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d131f]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && <h1 className="text-lg font-semibold text-slate-100">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* User profile info */}
        {user ? (
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-medium text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
            <StatusBadge status={user.role} type="role" className="ml-1 text-[10px]" />

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-md transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-all shadow-sm"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  );
}
