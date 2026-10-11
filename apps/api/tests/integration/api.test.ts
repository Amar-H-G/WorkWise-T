import request from 'supertest';
import app from '../../src/app';

describe('WorkWise API Integration Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let viewerToken: string;

  describe('Health and System Endpoints', () => {
    it('GET /health returns 200 and ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('workwise-api');
    });

    it('GET /ready returns 200 and database connected', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.database).toBe('connected');
    });

    it('GET /api/v1 returns version metadata', async () => {
      const res = await request(app).get('/api/v1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('WorkWise API');
      expect(res.body.version).toBe('v1');
    });
  });

  describe('Authentication Flow', () => {
    it('rejects login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@workwise.com', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('authenticates admin successfully and returns tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@workwise.com', password: 'Admin@12345' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
      adminToken = res.body.data.accessToken;
    });

    it('authenticates manager successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'manager@workwise.com', password: 'Manager@123' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('MANAGER');
      managerToken = res.body.data.accessToken;
    });

    it('authenticates viewer successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'viewer@workwise.com', password: 'Viewer@1234' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('VIEWER');
      viewerToken = res.body.data.accessToken;
    });

    it('rejects access to protected endpoints without token', async () => {
      const res = await request(app).get('/api/v1/vendors');
      expect(res.status).toBe(401);
    });
  });

  describe('Vendors Endpoints', () => {
    it('allows viewer to list vendors', async () => {
      const res = await request(app)
        .get('/api/v1/vendors')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('supports search query on vendors', async () => {
      const res = await request(app)
        .get('/api/v1/vendors?search=Bharat')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Bharat');
    });

    it('allows manager to create a vendor', async () => {
      const uniqueCode = `VND-T${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/v1/vendors')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Precision Instruments Ltd',
          code: uniqueCode,
          category: 'Electrical',
          email: 'contact@precisioninst.com',
          phone: '+91 98765 00000',
          city: 'Bangalore',
          state: 'Karnataka',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Precision Instruments Ltd');
    });

    it('forbids viewer from creating vendor (RBAC check)', async () => {
      const res = await request(app)
        .post('/api/v1/vendors')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Vendor',
          code: 'VND-NOPE',
          category: 'Civil',
          email: 'unauth@test.com',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Purchase Orders Endpoints', () => {
    it('lists purchase orders with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('allows creating a new purchase order with line items', async () => {
      // Get first vendor
      const vRes = await request(app)
        .get('/api/v1/vendors')
        .set('Authorization', `Bearer ${managerToken}`);
      const vendorId = vRes.body.data[0].id;

      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          vendorId,
          title: 'Automated Test Equipment PO',
          description: 'Testing PO generation workflow',
          deliveryAddress: 'Bengaluru Logistics Facility, Hub 4',
          lineItems: [
            {
              itemCode: 'IT-001',
              description: 'Industrial Sensor Array',
              quantity: 5,
              unitPrice: 12000,
              taxPercent: 18,
            },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.poNumber).toMatch(/^PO-\d{4}-\d{4}$/);
      expect(res.body.data.status).toBe('DRAFT');
    });
  });

  describe('Dashboard Metrics & Activities', () => {
    it('retrieves comprehensive dashboard metrics', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.kpis.totalPOValue).toBeDefined();
      expect(res.body.data.charts.monthlyTrend).toBeDefined();
      expect(res.body.data.charts.poByStatus).toBeDefined();
    });

    it('retrieves recent activity feed', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/activity')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
