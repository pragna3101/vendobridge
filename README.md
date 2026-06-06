# VendorBridge ERP System

VendorBridge is an enterprise-grade Procurement & Vendor Management ERP system built using Node.js/Express/TypeScript on the backend, React/Vite/TypeScript on the frontend, and Prisma/SQLite for database operations.

## Directory Structure

```
/vendorbridge-erp
  /backend
    /prisma
      schema.prisma      <-- Database layout (relational mapping)
      seed.ts            <-- 20 Vendors, 10 Users, 25 RFQs, 60 Quotations seeding
    /src
      /controllers       <-- Layered routing handlers (auth, vendors, rfqs, quotes)
      /middleware        <-- JWT & RBAC Auth guards, global error handler
      /services          <-- Nodemailer email, PDFKit PO/invoice generator
      /utils             <-- Logger, Zod validator rules
      app.ts             <-- Express middlewares mapping
      server.ts          <-- App bootstrap entry point
    package.json
    tsconfig.json
  /frontend
    /src
      /components        <-- Navigation menus, notification bells, profile panels
      /pages             <-- Screen views (dashboard cards, comparators, biddings)
      /services          <-- Axios token refresh client
      /store             <-- Redux auth and notification slices
      main.tsx           <-- Client entry point
      index.css          <-- Tailwind styling entry
    package.json
    tsconfig.json
    vite.config.ts
    tailwind.config.js
  docker-compose.yml
  package.json           <-- Orchestration wrapper
```

## Setup & Startup Instructions

### 1. Database Configuration

The application is pre-configured to use **SQLite** as the default database provider, which means you do not need to set up any external database (like PostgreSQL or Docker). The SQLite database file resides at `backend/prisma/dev.db`.

To generate the Prisma Client:
```bash
# Generate the Prisma Client
npm run prisma:generate
```

### 2. Seed Data Injection

Run the seed script to inject 20 vendors, 10 users, 25 RFQs, 60 quotations, and POs/Invoices:
```bash
npm run prisma:seed
```

### 3. Launch Development Servers

Start the backend and frontend concurrently:
```bash
# Start backend API (port 5000)
npm run dev:backend

# Start frontend Client (port 3000)
npm run dev:frontend
```

## User Login Credentials

All users have the default password `password123`:
- **Admin:** `admin@vendorbridge.com`
- **Procurement Officer:** `officer1@vendorbridge.com`
- **Manager / Approver:** `manager1@vendorbridge.com`
- **Vendor:** `vendor1@vendorbridge.com`

## Verified Flows

1. **Authentication Flow:** Access token and Refresh token verification; protected dashboard routing.
2. **Dashboard Visuals:** KPI counters, spend trend graphs, recent PO grids, and light/dark theme switches.
3. **RFQ Bidding Flow:** Procurement officer creates RFQ and line items; vendor bids quotation details.
4. **Quotation Comparison:** Side-by-side card comparator highlighting lowest prices, best delivery times, and vendor ratings.
5. **PO & Invoicing Flow:** Manager approves selected bid, PO generates automatically, vendor accepts PO and generates Invoice with PDF download controls.