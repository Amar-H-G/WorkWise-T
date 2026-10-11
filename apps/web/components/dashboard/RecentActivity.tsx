'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Building2,
  PackageCheck,
  CheckCircle2,
  Send,
  XCircle,
  LogIn,
  Activity as ActivityIcon,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  description: string;
  userName: string;
  userAvatar?: string | null;
  createdAt: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PO_CREATED':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'PO_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'PO_SENT':
        return <Send className="w-4 h-4 text-indigo-400" />;
      case 'PO_CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'VENDOR_CREATED':
      case 'VENDOR_UPDATED':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      case 'GR_CREATED':
      case 'GR_CONFIRMED':
        return <PackageCheck className="w-4 h-4 text-teal-400" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Live Activity Audit Feed</h2>
          <p className="text-xs text-slate-400">Chronological procurement and system events</p>
        </div>
        <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono">
          Audit Trail
        </span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {activities.length > 0 ? (
          activities.map((act) => {
            const timeAgo = formatDistanceToNow(new Date(act.createdAt), { addSuffix: true });
            return (
              <div key={act.id} className="py-3 flex items-start gap-3.5 hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {getActivityIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">{act.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">{act.userName}</span>
                    <span>•</span>
                    <span>{timeAgo}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No recent activity recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
