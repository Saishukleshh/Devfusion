# VendorVerse — Smart Multi-Vendor E-Commerce & Inventory Management Platform

> **Hackathon Submission**: DevFusion 4.0 (IIT Bombay)  
> **Problem Statement**: Smart Multi-Vendor E-Commerce & Inventory Management Platform  
> **Standout Differentiator**: AI-Powered WhatsApp & Messy Spreadsheet Catalog Importer  

---

## 🌟 Overview & Architecture

**VendorVerse** is a modern multi-vendor marketplace designed to digitize small Indian sellers running their businesses over WhatsApp, spreadsheets, and social media. It solves catalog creation friction, inventory mismatches, manual invoicing, and delayed deliveries through automation.

```
                  +-------------------------------------------------+
                  |          VendorVerse Web Application            |
                  |     Next.js 16 App Router + React 19 + TS       |
                  +------------------------+------------------------+
                                           |
            +------------------------------+------------------------------+
            |                              |                              |
+-----------v-----------+      +-----------v-----------+      +-----------v-----------+
|    AI Importer        |      | Express.js + Next API |      | AWS S3 Object Storage |
| Gemini 1.5 Flash      |      | Prisma ORM v6.3.0     |      | Presigned URLs & SDK  |
| Vision & Zod Parser   |      | PostgreSQL (Supabase) |      | Images & Videos       |
+-----------------------+      +-----------+-----------+      +-----------------------+
                                           |
                               +-----------v-----------+
                               |  Razorpay & Webhooks  |
                               |  HMAC Signature Check |
                               +-----------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technology Used | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Full-stack React 19 application with edge middleware and server route handlers. |
| **Backend Engine** | **Express.js + Next.js API** | Express.js application middleware integrated inside Next.js API route handlers (`src/lib/expressApp.ts`). |
| **File Storage** | **AWS S3 (`@aws-sdk/client-s3`)** | Pre-signed upload URLs and direct S3 object storage for product images, videos, and store media (`src/lib/s3.ts`). |
| **Language** | **TypeScript 5** | Strict type safety across database schemas, API contracts, and UI components. |
| **Styling** | **Tailwind CSS v4 + Custom CSS** | Luxury fashion editorial aesthetic (noise overlay, glassmorphism headers, high contrast). |
| **Database** | **PostgreSQL (Supabase)** | Relational database with foreign key cascades, unique indices, and JSON data support. |
| **ORM** | **Prisma Client v6.3.0** | 19 entities: Users, Roles, Sellers, Stores, Products, Categories, Variants, Inventory, Cart, Wishlist, Orders, Payments, Coupons, Reviews, Addresses, Notifications, Logs, Settings. |
| **Authentication** | **Custom JWT (`jose` + `bcryptjs`) + Google OAuth** | Lightweight HTTP-only session cookies with Google ID Token verification via `google-auth-library` and OTP password resets. |
| **Payments** | **Razorpay Gateway + Webhooks** | Online payments (UPI, Cards, Net Banking) with HMAC SHA-256 webhook signature verification + COD. |
| **AI Importer** | **Google Gemini 1.5 Flash Vision** | Multimodal image/text product extraction and single-pass LLM spreadsheet column mapping. |
| **Testing** | **Playwright (`@playwright/test`)** | Automated End-to-End E2E test suite covering store browsing, importer presets, and dashboards. |

---

## 💻 Commands Reference

### 1. Project Setup & Installation
```bash
# Install all node dependencies
npm install

# Push database schema to Supabase PostgreSQL
npx prisma db push

# Seed test categories, settings, products, and multi-role demo accounts
npx prisma db seed
```

### 2. Running Development Server
```bash
# Launch Next.js dev server on http://localhost:3000
npm run dev
```

### 3. Type Checking & Verification
```bash
# Run TypeScript type check across entire project
npx tsc --noEmit
```

### 4. Running End-to-End Playwright Tests
```bash
# Run automated E2E tests for store browsing, importer, and dashboards
npm run test:e2e
```

---

## 🔑 Demo Accounts & Quick Judging Guide

The application includes a universal **Role Switcher Navigation Bar** at the top of every dashboard for 1-click switching between views:

| Role View | Route | Description & Features |
| :--- | :--- | :--- |
| 🛒 **Customer** | `/customer` or `/dashboard` | Order tracking progress bar (Placed → Accepted → Packed → Shipped → Delivered), Out-of-Stock restock ETAs, Rupee (₹) pricing, and 1-click PDF tax invoice downloads. |
| 🏪 **Seller** | `/seller` or `/seller/dashboard` | Live catalog count, **Inventory Refill Alert Panel**, restock date picker/notes (*"after Diwali"*), and order state queue controls. |
| 🛡️ **Admin** | `/admin` | Master control hub overseeing platform revenue, verified stores, activity audit logs, and **Admin Auth Gate**. |
| ✨ **AI Importer** | `/importer` | **Standout Differentiator**: 1-click 30-second WhatsApp & Spreadsheet catalog digitization presets with editable review table. |
| 🛍️ **Shop Catalog** | `/products` | Editorial product showcase with category filtering, price range sliders, and debounced search. |

### Test Credentials (If logging in manually):
- **Customer**: `customer@vendorverse.com` / `Customer@123456`
- **Seller**: `seller@vendorverse.com` / `Seller@123456`
- **Admin**: `admin@vendorverse.com` / `Admin@123456` *(Also features a ⚡ Auto-Fill button on the Admin Gate)*

---

## 🚀 Key Features & Architectural Guarantees

### 1. Financial & Stock Accuracy Rules
- **Paise Precision**: All monetary values are stored strictly as integers in **paise** (`₹1 = 100 paise`), avoiding floating-point rounding errors.
- **Single Source of Stock Truth**: Inventory resides strictly in `ProductVariant.stock`.
- **Atomic Overselling Protection**: Payments API executes PostgreSQL row locking (`SELECT ... FOR UPDATE`) inside transactions during checkout to prevent race conditions.

### 2. AI Importer (The Differentiator)
- **Path A (WhatsApp)**: Extracts clean product listings from messy WhatsApp text captions (Hinglish, emojis, sizes) and product photos using Gemini 1.5 Flash.
- **Path B (Spreadsheet)**: Calls Gemini ONCE on headers + 2-3 sample rows to map original headers (*"Rate"*, *"Cost/pc"*, *"Stk"*) to canonical schema fields, then parses remaining rows deterministically.
- **Editable Review Table**: Sellers review and edit extracted listings before publishing to live stores (never auto-publishes raw AI output).

### 3. AWS S3 Object Storage & Express Backend Engine
- **AWS S3 Presigned Uploads**: `/api/upload/s3` generates presigned URLs for client-side uploads of product images and video demonstrations.
- **Express.js API Bridge**: `src/lib/expressApp.ts` integrates Express middleware inside Next.js App Router API route handlers.
- **Password Reset OTP**: `/api/auth/reset-password` handles 6-digit OTP verification and password reset links.

---

## 📁 Key File Structure Map

```
Devfusion/
├── INSTRUCTIONS.md               <-- You are here
├── playwright.config.ts          <-- Playwright test runner configuration
├── tests/
│   └── marketplace.spec.ts       <-- E2E Playwright test suite
├── prisma/
│   ├── schema.prisma             <-- 19 models + 6 enums database schema
│   └── seed.ts                   <-- Database seed script
├── src/
│   ├── app/
│   │   ├── page.tsx              <-- Editorial Landing Page
│   │   ├── products/             <-- Browse & Search Catalog
│   │   ├── customer/             <-- Customer Dashboard (/customer)
│   │   ├── dashboard/            <-- Customer Dashboard (/dashboard)
│   │   ├── seller/               <-- Seller Dashboard (/seller)
│   │   ├── admin/                <-- Admin Control Center with Auth Gate (/admin)
│   │   ├── importer/             <-- AI Catalog Importer with 30s presets
│   │   └── api/                  <-- 15+ Serverless API Route Handlers
│   ├── components/
│   │   └── RoleSwitcherNav.tsx   <-- Top Universal Role Switcher Bar
│   └── lib/
│       ├── expressApp.ts         <-- Express.js API app bridge
│       ├── s3.ts                 <-- AWS S3 SDK storage client
│       ├── gemini.ts             <-- Gemini Flash AI Extraction Module
│       ├── prisma.ts             <-- Singleton Prisma Client instance
│       └── auth/                 <-- JWT & RBAC Authentication helpers
└── README.md                     <-- High-level project summary & ER diagram
```
