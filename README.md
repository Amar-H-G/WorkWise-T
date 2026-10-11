# WorkWise — Industrial Procurement & Supply Chain SaaS

[![WorkWise CI](https://github.com/workwise/procurement/actions/workflows/ci.yml/badge.svg)](https://github.com/workwise/procurement)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue.svg)](https://www.postgresql.org/)

**WorkWise** is a full-stack, enterprise-grade Industrial Procurement and Supply Chain SaaS application designed for modern engineering, construction, and manufacturing enterprises. It provides end-to-end management of vendor catalogs, purchase order state machines, goods receiving notes (GRN) with QA inspection, and real-time spend analytics.

---

## 🏗 Architecture & Tech Stack

WorkWise is built as a high-performance monorepo utilizing npm workspaces:

```
├── apps/
│   ├── api/            # Express.js REST API with TypeScript, Winston, Helmet, CORS, Rate-Limiting
│   └── web/            # Next.js 16 (App Router) with Tailwind CSS, Recharts, Lucide, React Query
├── packages/
│   └── shared/         # Shared TypeScript interfaces, enums, status labels, and constants
├── prisma/             # PostgreSQL database schema & seed scripts
├── scripts/            # Database management and embedded PostgreSQL launcher
└── tests/              # End-to-end automated lifecycle workflow tests
```

### Backend (`apps/api`)
- **Runtime:** Node.js (v20+) with TypeScript
- **Framework:** Express.js 4
- **ORM & Database:** Prisma v5 with PostgreSQL 16+
- **Security:** JWT authentication (access + rotating refresh tokens), Bcrypt (12 salt rounds), Helmet security headers, configurable CORS, and rate limiting per endpoint
- **Validation:** Zod schemas for all request payloads and query parameters
- **Logging:** Structured Winston logging with correlation IDs and Morgan request logger
- **Testing:** Jest + Supertest (unit & integration testing)

### Frontend (`apps/web`)
- **Framework:** Next.js 16 with React 19 & Turbopack
- **Styling:** Vanilla CSS & Tailwind CSS with custom dark industrial executive theme
- **Visualizations:** Recharts (6-month spend trend area charts, PO status distribution donuts)
- **Icons:** Lucide React
- **Forms & Validation:** Controlled multi-line item dynamic calculation table with live GST and subtotal computation

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher

### 1. Installation
Clone the repository and install dependencies at the monorepo root:
```bash
npm install
```

### 2. Environment Setup
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Default local variables:
```ini
DATABASE_URL=postgresql://workwise:workwise_dev@localhost:5432/workwise_db
PORT=4000
JWT_SECRET=workwise_jwt_secret_for_development_only_not_production
JWT_REFRESH_SECRET=workwise_refresh_secret_dev_only_different_from_access
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Start Database & Seed
WorkWise includes a zero-dependency embedded PostgreSQL launcher:
```bash
# Start the local database daemon
npm run db:start

# In a new terminal, push the schema and seed initial data:
npm run db:migrate
npm run db:seed
```

### 4. Run Development Servers
Start both the API and Web frontend simultaneously:
```bash
npm run dev
```
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:4000](http://localhost:4000)
- **API Health Check:** [http://localhost:4000/health](http://localhost:4000/health)

---

## 🔐 Default Test Credentials & RBAC Matrix

The Login page includes **1-Click Test Credential Presets** for immediate evaluation:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@workwise.com` | `Admin@12345` | Full system access, approve POs, manage users, delete records |
| **Manager** | `manager@workwise.com` | `Manager@123` | Create vendors, create & approve POs, record goods receipts |
| **Viewer** | `viewer@workwise.com` | `Viewer@1234` | Read-only access to dashboard, vendors, POs, and receipts |

---

## 📦 Key Procurement Modules

### 1. Vendor Directory & Master Catalog (`/vendors`)
- Real-time search across vendor names, vendor codes (`VND-NNN`), emails, and cities.
- Category filtering: Electrical, Civil & Construction, Mechanical, Raw Materials, IT, Safety, Chemicals.
- Add Vendor modal with tax/registration details, address, contact persons, and status control.

### 2. Purchase Order Management (`/purchase-orders`)
- **State Machine Workflow:**
  $$\text{Draft} \longrightarrow \text{Pending Approval} \longrightarrow \text{Approved} \longrightarrow \text{Sent to Vendor} \longrightarrow \text{Partially Received} \longrightarrow \text{Fully Received}$$
- **Dynamic Line Items Editor (`/purchase-orders/new`):**
  - Add/remove line items dynamically
  - Automated line subtotal calculation: $(\text{Quantity} \times \text{Unit Price}) + \text{GST}$
  - Instant order totals: Subtotal, Total Tax, and Grand Total in INR
- **PO Details & Actions (`/purchase-orders/[id]`):**
  - Workflow buttons: Submit for Approval, Approve (Managers/Admins), Send to Vendor, Cancel
  - Printable purchase order layout for supplier dispatches

### 3. Goods Receipt Note (GRN) & QA Inspection (`/goods-receipts`)
- Record warehouse receipts against approved/dispatched purchase orders (`/goods-receipts/new`).
- Pre-populates unreceived quantities per line item.
- Supports recording **Accepted Quantity** vs. **Rejected Quantity** with QA inspection remarks.
- Automatically computes fulfillment progress and advances PO status to `PARTIALLY_RECEIVED` or `FULLY_RECEIVED`.
- Captures carrier logistics: Vehicle number, Driver name, Delivery Challan / Invoice number.

### 4. Operations Dashboard (`/`)
- Key Performance Indicators (KPIs): Total Procurement Spend, Month-over-Month change (%), Active POs, Pending Approvals, Active Suppliers, Goods Receipts awaiting inspection.
- 6-Month procurement commitment trend (Area Chart).
- PO Status distribution breakdown (Donut Chart).
- Live audit trail with human-readable timestamps and user avatars.

---

## 🧪 Testing Suite

WorkWise features a comprehensive, multi-layer testing strategy:

```bash
# Run unit & API integration tests (32 tests):
npm run test

# Run full automated E2E lifecycle test (7 verification stages):
npm run test:e2e

# Run type checking across all monorepo packages:
npm run typecheck

# Build all packages for production:
npm run build
```

---

## 🐳 Docker Deployment

To spin up the entire production environment with PostgreSQL, API, and Web services using Docker Compose:
```bash
docker compose up -d
```
All containers include health checks, persistent volumes, and non-root execution.
