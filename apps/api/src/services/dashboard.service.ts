import { prisma } from '../config/database';

export async function getDashboardMetrics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalVendors,
    activeVendors,
    totalPOs,
    activePOs,
    pendingApprovalPOs,
    totalPOValue,
    monthlyPOValue,
    prevMonthlyPOValue,
    totalGRs,
    pendingGRs,
    recentActivity,
    poByStatus,
    vendorsByCategory,
    monthlyPOTrend,
  ] = await Promise.all([
    // Vendor counts
    prisma.vendor.count(),
    prisma.vendor.count({ where: { status: 'ACTIVE' } }),

    // PO counts
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({
      where: { status: { in: ['APPROVED', 'SENT_TO_VENDOR', 'PARTIALLY_RECEIVED'] } },
    }),
    prisma.purchaseOrder.count({ where: { status: 'PENDING_APPROVAL' } }),

    // Total PO value (all time)
    prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: 'CANCELLED' } },
    }),

    // Monthly PO value (this month)
    prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
    }),

    // Previous month PO value
    prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
    }),

    // GR counts
    prisma.goodsReceipt.count(),
    prisma.goodsReceipt.count({ where: { status: { in: ['DRAFT', 'CONFIRMED'] } } }),

    // Recent activity
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    }),

    // PO by status
    prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { totalAmount: true },
    }),

    // Vendors by category
    prisma.vendor.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { status: 'ACTIVE' },
      orderBy: { _count: { category: 'desc' } },
      take: 6,
    }),

    // Monthly PO trend (last 6 months)
    prisma.$queryRaw<Array<{ month: string; count: bigint; total: string }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
        COUNT(*) as count,
        COALESCE(SUM("totalAmount"), 0)::text as total
      FROM purchase_orders
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        AND status != 'CANCELLED'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,
  ]);

  // Calculate month-over-month change
  const currentMonthValue = Number(monthlyPOValue._sum.totalAmount || 0);
  const prevMonthValue = Number(prevMonthlyPOValue._sum.totalAmount || 0);
  const poValueChange = prevMonthValue > 0
    ? ((currentMonthValue - prevMonthValue) / prevMonthValue) * 100
    : 0;

  return {
    kpis: {
      totalVendors,
      activeVendors,
      totalPOs,
      activePOs,
      pendingApprovalPOs,
      totalPOValue: Number(totalPOValue._sum.totalAmount || 0),
      monthlyPOValue: currentMonthValue,
      poValueChange: Math.round(poValueChange * 10) / 10,
      totalGRs,
      pendingGRs,
    },
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      type: a.type,
      entityType: a.entityType,
      entityId: a.entityId,
      entityLabel: a.entityLabel,
      description: a.description,
      userName: a.user.name,
      userAvatar: a.user.avatarUrl,
      createdAt: a.createdAt,
    })),
    charts: {
      poByStatus: poByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
        value: Number(s._sum.totalAmount || 0),
      })),
      vendorsByCategory: vendorsByCategory.map((v) => ({
        category: v.category,
        count: v._count.category,
      })),
      monthlyTrend: monthlyPOTrend.map((m) => ({
        month: m.month,
        count: Number(m.count),
        total: Number(m.total),
      })),
    },
  };
}

export async function getRecentActivity(limit = 20) {
  const activities = await prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  return activities.map((a) => ({
    id: a.id,
    type: a.type,
    entityType: a.entityType,
    entityId: a.entityId,
    entityLabel: a.entityLabel,
    description: a.description,
    userName: a.user.name,
    userAvatar: a.user.avatarUrl,
    metadata: a.metadata,
    createdAt: a.createdAt,
  }));
}
