import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'po' | 'vendor' | 'gr' | 'role';
  className?: string;
}

export function StatusBadge({ status, type = 'po', className = '' }: StatusBadgeProps) {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  if (type === 'po') {
    switch (status) {
      case 'DRAFT':
        badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700';
        break;
      case 'PENDING_APPROVAL':
        badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
        break;
      case 'APPROVED':
        badgeStyle = 'bg-blue-950/60 text-blue-300 border-blue-800/80';
        break;
      case 'SENT_TO_VENDOR':
        badgeStyle = 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80';
        break;
      case 'PARTIALLY_RECEIVED':
        badgeStyle = 'bg-teal-950/60 text-teal-300 border-teal-800/80';
        break;
      case 'FULLY_RECEIVED':
      case 'CLOSED':
        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
        break;
      case 'CANCELLED':
        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
        break;
    }
  } else if (type === 'vendor') {
    switch (status) {
      case 'ACTIVE':
        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
        break;
      case 'INACTIVE':
        badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700';
        break;
      case 'PENDING_REVIEW':
        badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
        break;
      case 'BLACKLISTED':
        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
        break;
    }
  } else if (type === 'gr') {
    switch (status) {
      case 'DRAFT':
        badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700';
        break;
      case 'CONFIRMED':
        badgeStyle = 'bg-blue-950/60 text-blue-300 border-blue-800/80';
        break;
      case 'INSPECTED':
        badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
        break;
      case 'ACCEPTED':
        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
        break;
      case 'REJECTED':
        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
        break;
    }
  } else if (type === 'role') {
    switch (status) {
      case 'ADMIN':
        badgeStyle = 'bg-purple-950/60 text-purple-300 border-purple-800/80';
        break;
      case 'MANAGER':
        badgeStyle = 'bg-blue-950/60 text-blue-300 border-blue-800/80';
        break;
      case 'VIEWER':
        badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700';
        break;
    }
  }

  const formatText = (text: string) => {
    return text
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {formatText(status)}
    </span>
  );
}
