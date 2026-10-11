export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED' | 'PENDING_REVIEW';

export type POStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT_TO_VENDOR'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CANCELLED'
  | 'CLOSED';

export type GRStatus = 'DRAFT' | 'CONFIRMED' | 'INSPECTED' | 'ACCEPTED' | 'REJECTED';

export type ActivityType =
  | 'PO_CREATED'
  | 'PO_APPROVED'
  | 'PO_SENT'
  | 'PO_CANCELLED'
  | 'GR_CREATED'
  | 'GR_CONFIRMED'
  | 'VENDOR_CREATED'
  | 'VENDOR_UPDATED'
  | 'USER_LOGIN'
  | 'USER_CREATED';

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginatedResult<unknown>['meta'];
}

export const VENDOR_CATEGORIES = [
  'Electrical',
  'Civil & Construction',
  'Mechanical & Machinery',
  'Raw Materials',
  'IT & Hardware',
  'Safety & PPE',
  'Chemicals',
  'Office Supplies',
  'Logistics & Packaging',
  'Maintenance & Tools',
] as const;

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  SENT_TO_VENDOR: 'Sent to Vendor',
  PARTIALLY_RECEIVED: 'Partially Received',
  FULLY_RECEIVED: 'Fully Received',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
};

export const GR_STATUS_LABELS: Record<GRStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  INSPECTED: 'Inspected',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  BLACKLISTED: 'Blacklisted',
  PENDING_REVIEW: 'Pending Review',
};
