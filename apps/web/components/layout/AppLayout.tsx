'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  requireAuth?: boolean;
}

export function AppLayout({
  children,
  title,
  subtitle,
  requireAuth = true,
}: AppLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push('/login');
    }
  }, [isLoading, user, requireAuth, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading WorkWise...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-screen bg-[#0b0f17] text-slate-100 overflow-hidden">
      {/* Sidebar navigation */}
      <React.Suspense fallback={<aside className="w-64 bg-[#0d131f] border-r border-slate-800" />}>
        <Sidebar />
      </React.Suspense>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title={title} subtitle={subtitle} />
        <main className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
