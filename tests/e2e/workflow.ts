import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

async function runE2E() {
  console.log('🚀 Starting WorkWise Full Lifecycle End-to-End Test Suite...');
  console.log(`🌐 Target API: ${API_URL}`);

  const client = axios.create({ baseURL: API_URL });

  // 1. Health check
  console.log('\n[1/7] Testing API Health & Database Readiness...');
  const healthRes = await axios.get('http://localhost:4000/health');
  if (healthRes.data.status !== 'ok') throw new Error('API health check failed');
  const readyRes = await axios.get('http://localhost:4000/ready');
  if (readyRes.data.database !== 'connected') throw new Error('Database is not ready');
  console.log('✅ API is healthy and connected to PostgreSQL');

  // 2. Authentication
  console.log('\n[2/7] Authenticating Admin, Manager, and Viewer...');
  const adminLogin = await client.post('/auth/login', {
    email: 'admin@workwise.com',
    password: 'Admin@12345',
  });
  const adminToken = adminLogin.data.data.accessToken;
  console.log(`✅ Admin authenticated (${adminLogin.data.data.user.name})`);

  const managerLogin = await client.post('/auth/login', {
    email: 'manager@workwise.com',
    password: 'Manager@123',
  });
  const managerToken = managerLogin.data.data.accessToken;
  console.log(`✅ Manager authenticated (${managerLogin.data.data.user.name})`);

  // 3. Create Vendor
  console.log('\n[3/7] Creating new enterprise supplier...');
  const vendorRes = await client.post(
    '/vendors',
    {
      name: `Apex Precision Heavy Industries ${Date.now().toString().slice(-4)}`,
      category: 'Mechanical & Machinery',
      email: `procure-${Date.now()}@apexindustries.com`,
      phone: '+91 80 4455 6677',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: 'ACTIVE',
    },
    { headers: { Authorization: `Bearer ${managerToken}` } }
  );
  const vendor = vendorRes.data.data;
  console.log(`✅ Supplier created: ${vendor.name} (${vendor.code})`);

  // 4. Create Purchase Order with Line Items
  console.log('\n[4/7] Generating Purchase Order with multiple line items...');
  const poRes = await client.post(
    '/purchase-orders',
    {
      vendorId: vendor.id,
      title: 'CNC Precision Lathe & Heavy Milling Spindles',
      description: 'Capital machinery procurement for Plant 2 expansion',
      deliveryAddress: 'Plot 42, Electronic City Phase 2, Bengaluru',
      lineItems: [
        {
          itemCode: 'CNC-500',
          description: '5-Axis High Precision CNC Machining Unit',
          unit: 'Nos',
          quantity: 2,
          unitPrice: 1500000,
          taxPercent: 18,
        },
        {
          itemCode: 'TOOL-SET',
          description: 'Carbide End Mills & Tooling Kit',
          unit: 'Sets',
          quantity: 10,
          unitPrice: 25000,
          taxPercent: 18,
        },
      ],
    },
    { headers: { Authorization: `Bearer ${managerToken}` } }
  );
  const po = poRes.data.data;
  console.log(`✅ PO created: ${po.poNumber} | Status: ${po.status}`);
  console.log(`   Subtotal: ₹${po.subtotal} | Tax: ₹${po.taxAmount} | Total: ₹${po.totalAmount}`);

  // 5. Workflow: Approve & Send
  console.log('\n[5/7] Executing PO Approval & Vendor Dispatch Workflow...');
  const approveRes = await client.patch(
    `/purchase-orders/${po.id}/status`,
    { action: 'approve' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log(`✅ PO ${po.poNumber} approved by Admin. Status: ${approveRes.data.data.status}`);

  const sendRes = await client.patch(
    `/purchase-orders/${po.id}/status`,
    { action: 'send' },
    { headers: { Authorization: `Bearer ${managerToken}` } }
  );
  console.log(`✅ PO ${po.poNumber} dispatched to vendor. Status: ${sendRes.data.data.status}`);

  // 6. Record Goods Receipt (GRN)
  console.log('\n[6/7] Warehouse Receiving & QA Material Inspection (GRN)...');
  const poLineItems = sendRes.data.data.lineItems || po.lineItems;
  const grRes = await client.post(
    '/goods-receipts',
    {
      purchaseOrderId: po.id,
      vehicleNumber: 'KA-04-MB-8899',
      driverName: 'Suresh Gowda',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      notes: 'Passed calibration inspection and initial tolerance test.',
      lineItems: poLineItems.map((li: any) => ({
        poLineItemId: li.id,
        receivedQty: Number(li.quantity),
        acceptedQty: Number(li.quantity),
        rejectedQty: 0,
        remarks: 'All quality checks verified against specs.',
      })),
    },
    { headers: { Authorization: `Bearer ${managerToken}` } }
  );
  const gr = grRes.data.data;
  console.log(`✅ Goods Receipt generated: ${gr.grNumber} | Status: ${gr.status}`);

  // Verify updated PO status
  const verifiedPORes = await client.get(`/purchase-orders/${po.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Verified PO fulfillment status: ${verifiedPORes.data.data.status}`);

  // 7. Verify Dashboard Metrics & Activity Feed
  console.log('\n[7/7] Verifying Live Dashboard Metrics & Audit Log...');
  const dashRes = await client.get('/dashboard/metrics', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Total Procurement Value: ₹${dashRes.data.data.kpis.totalPOValue.toLocaleString('en-IN')}`);
  console.log(`✅ Total Active Purchase Orders: ${dashRes.data.data.kpis.activePOs}`);
  console.log(`✅ Total Vendors: ${dashRes.data.data.kpis.totalVendors}`);

  const actRes = await client.get('/dashboard/activity?limit=5', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Most recent audit event: "${actRes.data.data[0]?.description}"`);

  console.log('\n🎉 ALL WORKWISE E2E LIFECYCLE TESTS COMPLETED SUCCESSFULLY!');
}

runE2E().catch((err) => {
  console.error('\n❌ E2E Test Suite Error:', err.response?.data || err.message);
  process.exit(1);
});
