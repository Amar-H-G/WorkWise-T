'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
    setLoading(true);
    try {
      await login({ email: presetEmail, password: presetPass });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mb-3">
            W
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">WorkWise Procurement</h1>
          <p className="text-sm text-slate-400 mt-1">Industrial supply chain & vendor management</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Logins for rapid evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Test Credentials (RBAC Demo):</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@workwise.com', 'Admin@12345')}
                disabled={loading}
                className="p-2 bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-700/60 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-semibold text-purple-400">Admin</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Full Access</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@workwise.com', 'Manager@123')}
                disabled={loading}
                className="p-2 bg-slate-900 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-semibold text-blue-400">Manager</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Approve PO</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('viewer@workwise.com', 'Viewer@1234')}
                disabled={loading}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-semibold text-slate-300">Viewer</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Read Only</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          Industrial Procurement Platform &copy; 2026 WorkWise
        </div>
      </div>
    </div>
  );
}
