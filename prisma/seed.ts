import { PrismaClient, UserRole, VendorStatus, POStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding WorkWise database...');

  // ─── Users ─────────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash('Admin@12345', 12);
  const managerHash = await bcrypt.hash('Manager@123', 12);
  const viewerHash = await bcrypt.hash('Viewer@1234', 12);

  const [admin, manager, viewer] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@workwise.com' },
      update: {},
      create: {
        email: 'admin@workwise.com',
        name: 'Priya Sharma',
        passwordHash: adminHash,
        role: UserRole.ADMIN,
        avatarUrl: null,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@workwise.com' },
      update: {},
      create: {
        email: 'manager@workwise.com',
        name: 'Rajesh Kumar',
        passwordHash: managerHash,
        role: UserRole.MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@workwise.com' },
      update: {},
      create: {
        email: 'viewer@workwise.com',
        name: 'Anita Patel',
        passwordHash: viewerHash,
        role: UserRole.VIEWER,
      },
    }),
  ]);

  console.log('✅ Users created');

  // ─── Vendors ───────────────────────────────────────────────────────────────

  const vendorData = [
    {
      code: 'VND-001',
      name: 'Bharat Electricals Pvt Ltd',
      legalName: 'Bharat Electricals Private Limited',
      email: 'contact@bharatelectricals.com',
      phone: '+91-80-12345678',
      website: 'https://bharatelectricals.com',
      status: VendorStatus.ACTIVE,
      category: 'Electrical',
      registrationNo: 'CIN-L31300KA2001PLC028290',
      taxId: 'GSTIN-29AABCB1234A1ZX',
      address: '45 Electronics City, Phase 1',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560100',
      rating: 4.5,
      notes: 'Preferred electrical supplier. Consistent quality.',
    },
    {
      code: 'VND-002',
      name: 'National Steel Works',
      email: 'sales@nationalsteel.in',
      phone: '+91-22-98765432',
      website: 'https://nationalsteel.in',
      status: VendorStatus.ACTIVE,
      category: 'Civil',
      registrationNo: 'CIN-L27100MH2003PLC140712',
      taxId: 'GSTIN-27AADCN5678B1Z2',
      address: 'Plot 12, MIDC Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400093',
      rating: 4.2,
    },
    {
      code: 'VND-003',
      name: 'Apex Mechanical Solutions',
      email: 'procurement@apexmech.com',
      phone: '+91-44-55551234',
      status: VendorStatus.ACTIVE,
      category: 'Mechanical',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      rating: 3.8,
      notes: 'Good for hydraulic components',
    },
    {
      code: 'VND-004',
      name: 'SafeGuard PPE Supplies',
      email: 'orders@safeguardppe.com',
      phone: '+91-40-99887766',
      status: VendorStatus.ACTIVE,
      category: 'Safety',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      rating: 4.7,
    },
    {
      code: 'VND-005',
      name: 'Precision Instruments Co.',
      email: 'sales@precisioninst.in',
      phone: '+91-79-11223344',
      status: VendorStatus.ACTIVE,
      category: 'Instrumentation',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      rating: 4.0,
    },
    {
      code: 'VND-006',
      name: 'Consolidated Pipes & Fittings',
      email: 'inquiry@cpf-india.com',
      status: VendorStatus.INACTIVE,
      category: 'Civil',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      rating: 3.2,
      notes: 'Currently under performance review',
    },
    {
      code: 'VND-007',
      name: 'Green Power Systems',
      email: 'info@greenpowersys.com',
      phone: '+91-80-44556677',
      status: VendorStatus.ACTIVE,
      category: 'Electrical',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      rating: 4.3,
    },
    {
      code: 'VND-008',
      name: 'Industrial Chemicals Ltd',
      email: 'orders@indchem.co.in',
      status: VendorStatus.PENDING_REVIEW,
      category: 'Chemicals',
      city: 'Vadodara',
      state: 'Gujarat',
      country: 'India',
    },
  ];

  const vendors: Record<string, { id: string }> = {};
  for (const v of vendorData) {
    const vendor = await prisma.vendor.upsert({
      where: { code: v.code },
      update: {},
      create: v as any,
    });
    vendors[v.code] = vendor;
  }

  // Add contacts for key vendors
  await prisma.vendorContact.createMany({
    data: [
      {
        vendorId: vendors['VND-001']!.id,
        name: 'Suresh Nair',
        designation: 'Sales Manager',
        email: 'suresh@bharatelectricals.com',
        phone: '+91-9988776655',
        isPrimary: true,
      },
      {
        vendorId: vendors['VND-002']!.id,
        name: 'Meena Joshi',
        designation: 'Account Manager',
        email: 'meena@nationalsteel.in',
        phone: '+91-9977665544',
        isPrimary: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Vendors created');

  // ─── Purchase Orders ────────────────────────────────────────────────────────

  const existingPOs = await prisma.purchaseOrder.count();
  if (existingPOs === 0) {
    // PO 1 - Electrical components (APPROVED)
    const po1 = await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO-2024-0001',
        vendorId: vendors['VND-001']!.id,
        createdById: manager.id,
        approvedById: admin.id,
        status: POStatus.APPROVED,
        title: 'Electrical Switchgear & Control Panels',
        description: 'Supply of HT/LT switchgear for main plant building',
        deliveryAddress: 'WorkWise Plant, Electronics City, Bangalore',
        deliveryDate: new Date('2024-03-15'),
        currency: 'INR',
        subtotal: new Decimal('850000.00'),
        taxAmount: new Decimal('153000.00'),
        totalAmount: new Decimal('1003000.00'),
        approvedAt: new Date('2024-01-10'),
        notes: 'Delivery to be coordinated with site engineer',
        lineItems: {
          create: [
            {
              itemCode: 'ELEC-001',
              description: 'HT Panel 11KV, 1250A',
              unit: 'Set',
              quantity: new Decimal(2),
              unitPrice: new Decimal(250000),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(590000),
              sortOrder: 0,
            },
            {
              itemCode: 'ELEC-002',
              description: 'LT Distribution Panel 415V, 800A',
              unit: 'Set',
              quantity: new Decimal(3),
              unitPrice: new Decimal(75000),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(265500),
              sortOrder: 1,
            },
            {
              itemCode: 'ELEC-003',
              description: 'Cable Tray 600mm x 100mm (Hot Dip Galvanized)',
              unit: 'Mtr',
              quantity: new Decimal(500),
              unitPrice: new Decimal(350),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(206500),
              sortOrder: 2,
            },
          ],
        },
      },
    });

    // PO 2 - Steel (SENT_TO_VENDOR)
    const po2 = await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO-2024-0002',
        vendorId: vendors['VND-002']!.id,
        createdById: manager.id,
        approvedById: admin.id,
        status: POStatus.SENT_TO_VENDOR,
        title: 'Structural Steel for Factory Extension',
        deliveryAddress: 'WorkWise Plant, Whitefield, Bangalore',
        deliveryDate: new Date('2024-04-01'),
        currency: 'INR',
        subtotal: new Decimal('1200000.00'),
        taxAmount: new Decimal('216000.00'),
        totalAmount: new Decimal('1416000.00'),
        approvedAt: new Date('2024-01-15'),
        sentAt: new Date('2024-01-16'),
        lineItems: {
          create: [
            {
              description: 'MS Structural Steel Beams ISMB 200',
              unit: 'MT',
              quantity: new Decimal(50),
              unitPrice: new Decimal(20000),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(1180000),
              sortOrder: 0,
            },
            {
              description: 'Anchor Bolts M24 x 600mm',
              unit: 'Nos',
              quantity: new Decimal(200),
              unitPrice: new Decimal(180),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(42480),
              sortOrder: 1,
            },
          ],
        },
      },
    });

    // PO 3 - Safety (DRAFT)
    await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO-2024-0003',
        vendorId: vendors['VND-004']!.id,
        createdById: manager.id,
        status: POStatus.DRAFT,
        title: 'Q1 Safety Equipment & PPE',
        description: 'Personal protective equipment for plant workers',
        currency: 'INR',
        subtotal: new Decimal('125000.00'),
        taxAmount: new Decimal('22500.00'),
        totalAmount: new Decimal('147500.00'),
        lineItems: {
          create: [
            {
              description: 'Safety Helmet Type I (ISI Marked)',
              unit: 'Nos',
              quantity: new Decimal(100),
              unitPrice: new Decimal(450),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(53100),
              sortOrder: 0,
            },
            {
              description: 'Safety Shoes Steel Toe (Size 7-10)',
              unit: 'Pair',
              quantity: new Decimal(50),
              unitPrice: new Decimal(1200),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(70800),
              sortOrder: 1,
            },
          ],
        },
      },
    });

    // PO 4 - Instrumentation (PARTIALLY_RECEIVED)
    const po4 = await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO-2024-0004',
        vendorId: vendors['VND-005']!.id,
        createdById: manager.id,
        approvedById: admin.id,
        status: POStatus.PARTIALLY_RECEIVED,
        title: 'Process Instrumentation Package',
        currency: 'INR',
        subtotal: new Decimal('680000.00'),
        taxAmount: new Decimal('122400.00'),
        totalAmount: new Decimal('802400.00'),
        approvedAt: new Date('2024-01-05'),
        lineItems: {
          create: [
            {
              itemCode: 'INST-001',
              description: 'Pressure Transmitter 4-20mA HART',
              unit: 'Nos',
              quantity: new Decimal(10),
              unitPrice: new Decimal(45000),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(531000),
              receivedQty: new Decimal(5),
              sortOrder: 0,
            },
            {
              itemCode: 'INST-002',
              description: 'Temperature Sensor PT100 with Thermowell',
              unit: 'Set',
              quantity: new Decimal(15),
              unitPrice: new Decimal(8000),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(141600),
              receivedQty: new Decimal(0),
              sortOrder: 1,
            },
          ],
        },
      },
    });

    // PO 5 - Cancelled
    await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO-2024-0005',
        vendorId: vendors['VND-003']!.id,
        createdById: manager.id,
        status: POStatus.CANCELLED,
        title: 'Hydraulic Pump Set (Cancelled)',
        currency: 'INR',
        subtotal: new Decimal('320000.00'),
        taxAmount: new Decimal('57600.00'),
        totalAmount: new Decimal('377600.00'),
        lineItems: {
          create: [
            {
              description: 'Hydraulic Gear Pump 50 LPM',
              unit: 'Nos',
              quantity: new Decimal(4),
              unitPrice: new Decimal(80000),
              taxPercent: new Decimal(18),
              totalPrice: new Decimal(377600),
              sortOrder: 0,
            },
          ],
        },
      },
    });

    // Add Goods Receipt for PO 4 (partial)
    await prisma.goodsReceipt.create({
      data: {
        grNumber: 'GR-2024-0001',
        purchaseOrderId: po4.id,
        receivedById: manager.id,
        status: 'ACCEPTED',
        receivedDate: new Date('2024-01-20'),
        vehicleNumber: 'KA-01-AB-1234',
        driverName: 'Ramesh P',
        invoiceNumber: 'INV-PRE-2024-001',
        lineItems: {
          create: [
            {
              poLineItemId: (await prisma.pOLineItem.findFirst({
                where: { purchaseOrderId: po4.id, itemCode: 'INST-001' },
              }))!.id,
              receivedQty: new Decimal(5),
              acceptedQty: new Decimal(5),
              rejectedQty: new Decimal(0),
              remarks: 'All items in good condition',
            },
          ],
        },
      },
    });

    console.log('✅ Purchase orders and goods receipts created');

    // ─── Activity Logs ──────────────────────────────────────────────────────

    await prisma.activityLog.createMany({
      data: [
        {
          userId: admin.id,
          type: 'USER_CREATED',
          entityType: 'User',
          entityId: manager.id,
          entityLabel: manager.name,
          description: 'Created manager account for Rajesh Kumar',
        },
        {
          userId: manager.id,
          type: 'VENDOR_CREATED',
          entityType: 'Vendor',
          entityId: vendors['VND-001']!.id,
          entityLabel: 'Bharat Electricals Pvt Ltd',
          description: 'Added new vendor: Bharat Electricals Pvt Ltd (VND-001)',
        },
        {
          userId: manager.id,
          type: 'PO_CREATED',
          entityType: 'PurchaseOrder',
          entityId: po1.id,
          entityLabel: 'PO-2024-0001',
          description: 'Created PO-2024-0001 for Bharat Electricals - Switchgear',
          metadata: { totalAmount: '1003000' },
        },
        {
          userId: admin.id,
          type: 'PO_APPROVED',
          entityType: 'PurchaseOrder',
          entityId: po1.id,
          entityLabel: 'PO-2024-0001',
          description: 'Approved PO-2024-0001 - Electrical Switchgear & Control Panels',
        },
        {
          userId: manager.id,
          type: 'PO_CREATED',
          entityType: 'PurchaseOrder',
          entityId: po2.id,
          entityLabel: 'PO-2024-0002',
          description: 'Created PO-2024-0002 for National Steel Works',
          metadata: { totalAmount: '1416000' },
        },
        {
          userId: admin.id,
          type: 'PO_SENT',
          entityType: 'PurchaseOrder',
          entityId: po2.id,
          entityLabel: 'PO-2024-0002',
          description: 'Sent PO-2024-0002 to National Steel Works',
        },
        {
          userId: manager.id,
          type: 'GR_CREATED',
          entityType: 'GoodsReceipt',
          entityId: (await prisma.goodsReceipt.findFirst({ where: { grNumber: 'GR-2024-0001' } }))!.id,
          entityLabel: 'GR-2024-0001',
          description: 'Created GR-2024-0001 for PO-2024-0004 (partial)',
        },
      ],
    });

    console.log('✅ Activity logs created');
  } else {
    console.log('⏭️ POs already exist, skipping PO seed');
  }

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:   admin@workwise.com / Admin@12345');
  console.log('  Manager: manager@workwise.com / Manager@123');
  console.log('  Viewer:  viewer@workwise.com / Viewer@1234');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
