# WaysERP — Product Requirements Document (PRD)
### Comprehensive Product Specification & Roadmap

**Version:** 1.0
**Date:** April 2026
**Author:** WaysERP Product Team
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Mission](#2-product-vision--mission)
3. [Target Market & User Personas](#3-target-market--user-personas)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Current System — What Is Built (v1.0)](#5-current-system--what-is-built-v10)
6. [Functional Requirements — Current Modules](#6-functional-requirements--current-modules)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [Compliance & Regulatory Requirements](#9-compliance--regulatory-requirements)
10. [Phase 2 — High-Value Additions](#10-phase-2--high-value-additions)
11. [Phase 3 — Advanced Enterprise Features](#11-phase-3--advanced-enterprise-features)
12. [Phase 4 — AI & Intelligence Layer](#12-phase-4--ai--intelligence-layer)
13. [Monetisation Strategy](#13-monetisation-strategy)
14. [Success Metrics & KPIs](#14-success-metrics--kpis)
15. [Risk Register](#15-risk-register)
16. [Glossary](#16-glossary)

---

## 1. Executive Summary

**WaysERP** is a cloud-based, multi-tenant Enterprise Resource Planning (ERP) system purpose-built for Nigerian SMEs and growing enterprises. It combines core business management functions — invoicing, inventory, CRM, and accounting — with deep integration into Nigeria's tax infrastructure through the Federal Inland Revenue Service (FIRS) e-invoicing and fiscalization platform.

### The Problem We Solve

Nigerian businesses face a perfect storm of operational challenges:

1. **Regulatory compliance burden** — FIRS e-invoicing mandates are expanding. Non-compliant businesses face penalties, audits, and loss of operating licences.
2. **Fragmented tooling** — Most SMEs use WhatsApp for sales, Excel for invoices, a separate accounting package, and manual stockbooks. Data is siloed, duplicated, and error-prone.
3. **Expensive international ERP** — SAP, Oracle, and QuickBooks are priced for Western markets and lack FIRS integration. Local workarounds are cobbled together and unreliable.
4. **Talent gap** — Many businesses cannot afford a dedicated accountant or finance team. The system must be operable by non-specialists.

### The Solution

WaysERP delivers a unified, affordable platform that:
- Issues government-compliant (FIRS-fiscalized) invoices in seconds
- Tracks stock, customers, deals, and finances in one place
- Scales from a single-user SME to a multi-branch enterprise
- Requires zero accounting knowledge to operate day-to-day

---

## 2. Product Vision & Mission

### Vision
> *"To be the operating system for every Nigerian business — from market trader to multinational."*

### Mission
> *"Make world-class business management accessible, affordable, and compliant for every Nigerian enterprise."*

### Core Values

| Value | Description |
|-------|-------------|
| **Compliance First** | Every feature is designed with Nigerian tax law as a constraint, not an afterthought |
| **Simplicity** | A market trader should be able to create and fiscalize an invoice in under 60 seconds |
| **Reliability** | Financial data must never be lost, corrupted, or silently wrong |
| **Scalability** | A system that grows with the business — from 1 user to 1,000 |
| **Transparency** | Every transaction is logged, auditable, and immutable once committed |

---

## 3. Target Market & User Personas

### Primary Market
- **Geography:** Nigeria (all states, with focus on Lagos, Abuja, Kano, Port Harcourt, Ibadan)
- **Business Size:** 5–500 employees
- **Sectors:** Retail, distribution, manufacturing, services, FMCG, construction, hospitality

### User Personas

#### Persona 1 — "Bola the Business Owner"
- **Role:** Sole proprietor or MD of a distribution company (50 employees)
- **Pain Points:** Spends 3 hours weekly reconciling Excel sheets. Received a FIRS query last year. Cannot tell in real-time what his business is worth.
- **Goals:** Spend less time on admin, avoid FIRS penalties, know his cash position daily
- **Tech Comfort:** Uses WhatsApp and has a smartphone. Comfortable with apps but not technical.
- **Key Features Needed:** Dashboard, invoicing, fiscalization, reports

#### Persona 2 — "Amaka the Accountant"
- **Role:** In-house accountant for a medium manufacturer (200 employees)
- **Pain Points:** Manually reconciles purchase invoices against delivery notes. Month-end close takes 5 days. Auditors request documents she cannot find easily.
- **Goals:** Automated double-entry, real-time trial balance, audit trail
- **Tech Comfort:** High — uses accounting software but needs FIRS integration
- **Key Features Needed:** Journal entries, chart of accounts, reports, audit logs

#### Persona 3 — "Emeka the Sales Manager"
- **Role:** Sales lead at a FMCG company (regional team of 12)
- **Pain Points:** Loses track of which leads were followed up. Cannot see pipeline value. Manually creates invoices in Word.
- **Goals:** Track all leads, see pipeline health, create invoices from CRM
- **Tech Comfort:** Medium — uses CRM tools at previous job
- **Key Features Needed:** CRM, leads, pipeline, deals, invoice from contact

#### Persona 4 — "Fatima the Store Manager"
- **Role:** Manages warehouse and stock for a retail chain (3 locations)
- **Pain Points:** Stock discrepancies at month-end. Reorder requests by WhatsApp. No visibility into which products are selling fastest.
- **Goals:** Real-time stock levels, automated low-stock alerts, purchase orders
- **Tech Comfort:** Low to medium
- **Key Features Needed:** Inventory, warehouses, purchase orders, stock adjustments

---

## 4. Competitive Landscape

### Direct Competitors in Nigeria

| Product | Strengths | Weaknesses vs WaysERP |
|---------|-----------|----------------------|
| **Sage 50/200** | Well-known brand, accounting depth | No FIRS integration, expensive, complex |
| **QuickBooks** | Easy to use, global brand | No fiscalization, no inventory, USD-centric |
| **TradeDepot** | Strong distribution focus | No full accounting, narrow market |
| **Erply** | POS strength | No Nigerian compliance, no FIRS |
| **Odoo (self-hosted)** | Extremely powerful | Too complex, requires IT expertise, no FIRS |
| **Excel/Manual** | Free, familiar | No audit trail, no FIRS, no real-time data |

### WaysERP Competitive Advantages

1. **Native FIRS fiscalization** — No competitor offers end-to-end FIRS API integration out of the box
2. **All-in-one** — Invoice + CRM + Inventory + Accounting in one login
3. **Built for Nigeria** — NGN, Nigerian VAT (7.5%), NUBAN bank accounts, Nigerian business patterns
4. **Affordable SaaS pricing** — No per-module fees; tiered by user count
5. **Multi-tenant** — One platform serves many businesses with full data isolation
6. **Simple enough for non-accountants** — No jargon, guided workflows, sensible defaults

---

## 5. Current System — What Is Built (v1.0)

### Backend (Java Spring Boot)
| Module | Components | Status |
|--------|-----------|--------|
| Authentication | Login, 2FA OTP, JWT, password change, register | ✅ Complete |
| User Management | RBAC (Admin/Manager/User), approvals, permissions | ✅ Complete |
| Tenant Management | Multi-tenant isolation, logo upload, settings | ✅ Complete |
| Fiscalization | IRN generation, FIRS validation, digital signing, QR code, PDF receipt | ✅ Complete |
| Invoicing | CRUD, fiscalize, payment status, PDF export, credit/debit notes | ✅ Complete |
| CRM | Contacts, companies, leads, pipelines, deals, activities | ✅ Complete |
| Inventory | Products, categories, warehouses, stock, purchase orders, sales orders | ✅ Complete |
| Accounting | Chart of accounts, journal entries, bank accounts, bills, payments, reports | ✅ Complete |
| Notifications | Email service, audit logs | ✅ Complete |

### Frontend (Next.js 14 + TypeScript)
| Page | Features | Status |
|------|---------|--------|
| Login / Register / 2FA | Full auth flow | ✅ Complete |
| Dashboard | KPIs, revenue chart, lead funnel, low stock alerts, quick actions | ✅ Complete |
| Invoices | CRUD, bulk fiscalize, preview modal, PDF download, credit/debit notes | ✅ Complete |
| CRM | Contacts (card grid), companies, leads (funnel + table), pipeline (kanban), activities | ✅ Complete |
| Inventory | Products, stock levels, warehouses, POs, SOs | ✅ Complete |
| Accounting | Overview, chart of accounts, journals, bills, bank accounts, reports | ✅ Complete |
| Settings | Profile, security/password, company logo upload | ✅ Complete |
| Users | User CRUD, role management, approvals, permissions | ✅ Complete |
| Tenants | Tenant management (admin only) | ✅ Complete |

---

## 6. Functional Requirements — Current Modules

### 6.1 Authentication & Security

**FR-AUTH-001:** System shall authenticate users via email + password.
**FR-AUTH-002:** System shall enforce two-factor authentication (OTP via email) on every login.
**FR-AUTH-003:** System shall issue JWT tokens with configurable expiry.
**FR-AUTH-004:** System shall force first-login password change.
**FR-AUTH-005:** System shall support role-based access: ADMIN, MANAGER, USER.
**FR-AUTH-006:** System shall require administrator approval for MANAGER role.
**FR-AUTH-007:** All API endpoints shall be protected by bearer token authentication.
**FR-AUTH-008:** System shall log all authentication events (success, failure, logout).

### 6.2 Invoice & Fiscalization

**FR-INV-001:** Users shall create invoices with customer details, line items, VAT, and discounts.
**FR-INV-002:** System shall auto-generate sequential, gap-free invoice numbers.
**FR-INV-003:** System shall calculate subtotal, VAT (7.5% default), discounts, and total automatically.
**FR-INV-004:** Users shall fiscalize invoices through the FIRS 4-step process: IRN → Validate → Sign → QR Code.
**FR-INV-005:** Fiscalized invoices shall be immutable — no edits or deletions permitted.
**FR-INV-006:** System shall support credit notes and debit notes against fiscalized invoices.
**FR-INV-007:** Users shall download invoices as PDF with company logo embedded.
**FR-INV-008:** System shall support bulk fiscalization of multiple draft invoices.
**FR-INV-009:** System shall support multi-currency invoicing (NGN, USD, GBP, EUR).
**FR-INV-010:** System shall allow updating payment status on FIRS for fiscalized invoices.
**FR-INV-011:** System shall generate and store QR codes on fiscalized invoices.
**FR-INV-012:** System shall support various invoice types: Standard, Proforma, Credit Note, Debit Note.

### 6.3 CRM

**FR-CRM-001:** Users shall create and manage customer contacts with full details including TIN.
**FR-CRM-002:** Selecting a contact on an invoice shall auto-populate customer fields.
**FR-CRM-003:** Users shall manage company profiles and link contacts to companies.
**FR-CRM-004:** Users shall create leads with source tracking and estimated value.
**FR-CRM-005:** System shall support lead stage progression: NEW → CONTACTED → QUALIFIED → CONVERTED.
**FR-CRM-006:** System shall display lead funnel summary with counts per stage.
**FR-CRM-007:** Users shall create and manage sales pipelines with custom stages.
**FR-CRM-008:** Deals shall be manageable via a Kanban board view.
**FR-CRM-009:** Deals shall show total pipeline value per stage.
**FR-CRM-010:** Users shall log activities (calls, emails, meetings) against leads and contacts.
**FR-CRM-011:** Users shall search contacts by name or email in real time.

### 6.4 Inventory

**FR-INV-001:** Users shall create products with SKU, barcode, pricing, and VAT rate.
**FR-INV-002:** System shall track stock levels per product per warehouse.
**FR-INV-003:** System shall alert when stock falls below reorder point.
**FR-INV-004:** Users shall create and manage multiple warehouses.
**FR-INV-005:** System shall create purchase orders with line items and supplier details.
**FR-INV-006:** Receiving a purchase order shall automatically increase warehouse stock.
**FR-INV-007:** Fulfilling a sales order shall automatically decrease warehouse stock.
**FR-INV-008:** Users shall adjust stock quantities with mandatory reason (audit trail).
**FR-INV-009:** System shall support multiple product categories.
**FR-INV-010:** System shall support product variants (size, colour, etc.).
**FR-INV-011:** Users shall search products by name, SKU, or barcode.

### 6.5 Accounting

**FR-ACC-001:** System shall maintain a configurable chart of accounts (Assets, Liabilities, Equity, Revenue, Expense).
**FR-ACC-002:** System shall record double-entry journal entries with balance validation.
**FR-ACC-003:** System shall maintain bank account register with balances.
**FR-ACC-004:** System shall track supplier bills through lifecycle: Draft → Pending → Approved → Paid.
**FR-ACC-005:** System shall flag overdue bills automatically.
**FR-ACC-006:** System shall generate trial balance report.
**FR-ACC-007:** System shall generate Profit & Loss statement.
**FR-ACC-008:** System shall generate Balance Sheet.
**FR-ACC-009:** Accounting records shall be immutable once posted (corrected by reversing entries only).

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds on 4G connection |
| Invoice creation to fiscalization | < 5 seconds end-to-end |
| API response time (95th percentile) | < 500ms |
| Concurrent users supported | 500 per tenant |
| Database query time | < 100ms for standard queries |

### 7.2 Reliability & Availability

| Requirement | Target |
|-------------|--------|
| System uptime | 99.5% (≈ 44 hours downtime/year) |
| Data backup frequency | Every 6 hours |
| Backup retention | 90 days |
| Recovery Time Objective (RTO) | < 4 hours |
| Recovery Point Objective (RPO) | < 6 hours |
| FIRS API failure handling | Retry with exponential backoff (3 attempts) |

### 7.3 Security

| Requirement | Specification |
|-------------|--------------|
| Authentication | JWT + 2FA mandatory |
| Password storage | BCrypt hashing (minimum cost factor 12) |
| Data in transit | TLS 1.2+ (HTTPS only) |
| Data at rest | AES-256 encryption for sensitive fields |
| Session management | Token expiry + refresh token rotation |
| API rate limiting | 100 requests/minute per user |
| SQL injection prevention | Parameterised queries via JPA |
| XSS prevention | Input sanitisation + CSP headers |
| Audit logging | All financial operations logged with user + timestamp |
| RBAC | Role and permission checks on every protected endpoint |

### 7.4 Scalability

- **Multi-tenant architecture** — Each tenant's data fully isolated at database level
- **Horizontal scaling** — Stateless API services deployable behind load balancer
- **Database** — PostgreSQL with read replicas for reporting queries
- **File storage** — CDN-backed for PDF and logo storage (Phase 2)
- **Background jobs** — Async queue for PDF generation and email sending

### 7.5 Usability

- Mobile-responsive design — works on phones, tablets, desktop
- No formal training required for basic invoicing (< 15 minutes to first invoice)
- All error messages in plain English — no technical codes shown to users
- Form fields include contextual hints explaining what each field is for
- Bulk operations available for high-volume workflows

---

## 8. Technical Architecture

### Backend Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Language | Java 17 | Type safety, performance, long-term support |
| Framework | Spring Boot 3.2.1 | Industry standard, mature ecosystem |
| Database | PostgreSQL 15 | ACID compliance, JSON support, proven reliability |
| ORM | Spring Data JPA / Hibernate | Reduces boilerplate, schema management |
| Security | Spring Security + JWT (jjwt 0.11.5) | Industry standard for API security |
| PDF Generation | iText7 7.2.5 | Robust PDF creation with image support |
| QR Code | ZXing 3.5.1 | Widely used, open source |
| Email | Spring Mail (SMTP) | Simple, reliable email delivery |
| HTTP Client | Spring WebFlux WebClient | Non-blocking FIRS API calls |
| Resilience | Spring Retry + AOP | Exponential backoff for FIRS failures |
| API Docs | SpringDoc OpenAPI 2.2.0 | Auto-generated Swagger documentation |
| Excel | Apache POI 5.2.3 | Future report exports |

### Frontend Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Framework | Next.js 14 (App Router) | SSR, excellent DX, production ready |
| Language | TypeScript | Type safety, fewer runtime bugs |
| Styling | Tailwind CSS | Utility-first, consistent design system |
| State (server) | TanStack React Query | Cache, background refresh, optimistic updates |
| State (client) | Zustand | Lightweight, simple global state |
| Forms | React Hook Form + Zod | Performance, schema validation |
| HTTP | Axios | Interceptors for auth token injection |
| Notifications | react-hot-toast | Non-intrusive user feedback |
| Icons | Lucide React | Consistent, tree-shakeable icon library |

### Deployment Architecture (Target)

```
Internet
    │
    ▼
CDN (Static assets, logos, PDFs)
    │
    ▼
Load Balancer (HTTPS termination)
    │
    ├── Next.js App (Frontend) ──────────────────────┐
    │                                                  │
    └── Spring Boot API (Backend)                      │
              │                                        │
              ├── PostgreSQL Primary (Read/Write)       │
              ├── PostgreSQL Replica (Read/Reports)     │
              ├── Redis (Session cache, rate limiting)  │
              └── FIRS API (External)                   │
                                                        │
                                         S3/Object Storage (PDFs, Logos)
```

---

## 9. Compliance & Regulatory Requirements

### 9.1 FIRS Fiscalization (Current)

Nigeria's Federal Inland Revenue Service requires:

| Requirement | WaysERP Implementation |
|-------------|----------------------|
| Unique Invoice Reference Number (IRN) | Auto-generated via FIRS API — Step 1 |
| Digital signature / invoice hash | Applied in signing processor — Step 3 |
| QR code for verification | Generated post-signing — Step 4 |
| VAT at 7.5% | Default tax rate, configurable per product |
| Sequential invoice numbering (no gaps) | System-generated, immutable sequence |
| Immutable invoice records | Fiscalized invoices cannot be edited or deleted |
| Credit note reversals only | Credit/Debit note workflow enforced |
| Real-time FIRS reporting | Fiscalization calls FIRS API synchronously |

### 9.2 Data Residency
- All data stored in Nigerian or West African data centres (or explicitly agreed alternatives)
- Tenant data is logically isolated — one tenant cannot access another's data

### 9.3 NDPR (Nigeria Data Protection Regulation)
- Personal data (names, emails, TINs) encrypted at rest
- Data retention policies configurable per tenant
- Right-to-deletion support (Phase 2)
- Data processing agreement (DPA) available for enterprise clients

### 9.4 CAC & Business Registration
- System collects and stores Business ID and Service ID at registration
- These are used for FIRS API authentication per tenant

---

## 10. Phase 2 — High-Value Additions

*Estimated timeline: 6–12 months post-launch*

These features significantly increase product value and address the most common customer requests:

### 10.1 Point of Sale (POS) Module

**Why it matters:** Retail businesses need fast, touch-optimised billing at the counter. A POS that auto-fiscalizes is a major differentiator.

**Requirements:**
- Full-screen POS interface optimised for tablet and touchscreen
- Product search by name, SKU, or barcode scan
- Cart management — add, remove, adjust quantities
- Multiple payment methods: Cash, Card (POS terminal integration), Transfer, Split payment
- Instant receipt printing (thermal printer support)
- Auto-fiscalization at checkout — customer gets a legal receipt in < 3 seconds
- Offline mode — POS works without internet, syncs when connection restored
- Shift management — open/close cashier sessions with float reconciliation
- Discount and promotion engine — percentage or fixed amount discounts
- Customer-facing display (optional second screen)

**Technical notes:**
- IndexedDB for offline product catalogue and transaction queue
- Background sync when internet restored
- WebSocket for real-time stock updates across terminals

### 10.2 Proforma Invoice

**Why it matters:** Many Nigerian businesses issue proforma invoices (quotes) before the actual sale is confirmed.

**Requirements:**
- Create proforma invoices identical to standard invoices
- Convert proforma to actual invoice with one click
- Proformas are NOT fiscalized (they are not tax documents)
- Email proforma directly to customer
- Track proforma conversion rate

### 10.3 WhatsApp Integration

**Why it matters:** WhatsApp is the primary business communication tool in Nigeria. Sending invoices via WhatsApp increases collection rates dramatically.

**Requirements:**
- Send invoice PDF/link directly to customer's WhatsApp number via WhatsApp Business API
- Receipt notification to customer after fiscalization
- Payment reminder messages (overdue invoice alerts)
- Configurable message templates
- Two-way: customer can reply "PAID" to update payment status (optional advanced feature)

**Technical notes:**
- WhatsApp Business API (Meta) integration
- Message queue for rate limiting
- Opt-in/opt-out management for customers

### 10.4 Email Invoice Delivery

**Why it matters:** Customers need invoices delivered to them, not just available for download.

**Requirements:**
- Send invoice PDF directly from the system to customer email
- Branded email template with company logo
- Payment link in email (Phase 3)
- Delivery status tracking (sent, opened, bounced)
- Automatic payment reminder emails (3 days before due, on due date, 7 days overdue)
- BCC copy to company email for records

### 10.5 Advanced Reporting & Analytics

**Why it matters:** Business owners need to make decisions based on data, not gut feel.

**Reports to add:**

| Report | Description |
|--------|-------------|
| **VAT Report** | Monthly VAT collected, VAT input, VAT payable to FIRS |
| **Sales by Customer** | Revenue per customer, top customers, customer growth |
| **Sales by Product** | Best-selling products, worst performing, margins |
| **Inventory Valuation** | Total stock value at cost and at selling price |
| **Ageing Report (Receivables)** | Invoices grouped by how overdue they are (30/60/90/90+ days) |
| **Ageing Report (Payables)** | Bills grouped by how overdue they are |
| **Cash Flow Statement** | Money in vs money out by period |
| **Daily Sales Summary** | What was sold today, by whom, via which channel |
| **Stock Movement Report** | Full history of stock in and out per product |
| **Sales Rep Performance** | If multiple users create invoices, compare performance |

**Export formats:**
- PDF (formatted for printing and filing)
- Excel/CSV (for further analysis in spreadsheet tools)

### 10.6 Payment Integration (Pay Online)

**Why it matters:** Making it easy for customers to pay online increases collection rates and reduces the need for manual payment tracking.

**Payment Gateways to integrate:**

| Gateway | Why |
|---------|-----|
| **Paystack** | Nigeria's most popular payment gateway; cards, bank transfer, USSD |
| **Flutterwave** | Multi-country support, good for businesses with diaspora customers |
| **Remita** | Government payments, widely trusted in enterprise |
| **Bank Transfer (NIP)** | Auto-reconciliation of NEFT/NIP transfers via bank APIs |

**Requirements:**
- Add "Pay Now" button to invoice PDF and email
- Customer lands on secure payment page
- On successful payment, invoice status auto-updates to PAID
- FIRS notified of payment status change
- Payment confirmation email to customer and business

### 10.7 Multi-Currency & Exchange Rates

**Why it matters:** Exporting businesses invoice in USD/GBP. Importers pay suppliers in foreign currency.

**Requirements:**
- Invoice in any currency (USD, GBP, EUR, GHS, XOF, etc.)
- Real-time exchange rate API (CBN rate or open market rate — configurable)
- Equivalent NGN value shown for all foreign currency transactions
- Forex gain/loss tracking for accounting
- Multi-currency bank accounts

### 10.8 Customer Portal (Self-Service)

**Why it matters:** Customers can view, download, and pay their invoices without calling your office.

**Requirements:**
- Customer receives a unique link to their secure portal
- View all invoices addressed to them
- Download PDFs
- Pay online (Phase 2.6)
- View payment history
- Raise disputes or queries (basic ticket)
- No login required — magic link authentication

### 10.9 Stock Valuation Methods

**Why it matters:** Different businesses use different accounting methods for valuing stock.

**Requirements:**
- **FIFO (First In First Out)** — First goods purchased are the first sold
- **Weighted Average Cost** — Average cost of all units in stock
- Configurable per tenant
- Impact shown on P&L and inventory valuation reports
- Stock valuation report with cost basis

### 10.10 Goods Receipt Note (GRN)

**Why it matters:** Proper three-way matching (PO → GRN → Supplier Invoice) is essential for procurement control.

**Requirements:**
- Generate GRN automatically when PO is received
- GRN can be partial (not all goods arrived)
- Multiple GRNs against one PO
- GRN number for reference
- Print/PDF GRN document
- Match GRN against supplier invoice before approving bill

---

## 11. Phase 3 — Advanced Enterprise Features

*Estimated timeline: 12–24 months post-launch*

### 11.1 Multi-Branch / Multi-Location Management

**Why it matters:** Growing businesses have multiple locations. They need consolidated reports while keeping branch operations separate.

**Requirements:**
- Each branch is a separate operational unit (stock, sales, cashiers)
- Consolidated dashboard for head office showing all branches
- Inter-branch stock transfers
- Branch-level P&L
- Branch manager role — sees only their branch
- Consolidated financial reports across all branches
- Invoice prefix by branch (e.g., "LG-INV-001" for Lagos, "ABJ-INV-001" for Abuja)

### 11.2 Payroll Module

**Why it matters:** HR and payroll is a pain point for every business. Integration means salary payments automatically create accounting entries.

**Requirements:**
- Employee profiles (basic HR information)
- Salary structures (basic, housing, transport, etc.)
- Monthly payroll processing with deductions
- PAYE (Pay As You Earn) tax calculation per Income Tax Act
- Pension (PFA) deduction (10% employer + 8% employee)
- Net pay calculation
- Payslip generation (PDF)
- Integration with bank accounts for bulk payment instruction file
- Payroll journal entry auto-created in accounting
- Annual tax summary (Form H1 equivalent)

### 11.3 Asset Management

**Why it matters:** Businesses own equipment, vehicles, and furniture. Tracking depreciation is an accounting requirement.

**Requirements:**
- Register fixed assets (name, cost, purchase date, category, location)
- Depreciation methods: Straight Line, Reducing Balance
- Auto-generate monthly depreciation journal entries
- Asset register report
- Disposal workflow (sale or write-off)
- Asset tagging with QR code printout

### 11.4 Project Costing & Billing

**Why it matters:** Service companies (construction, consulting, agencies) bill by project, not by product.

**Requirements:**
- Create projects with budget, start/end dates, client
- Assign expenses and time to projects
- Project P&L (revenue vs costs)
- Generate invoice from project (billable milestones)
- Timesheet input for professional services
- WIP (Work in Progress) accounting entries

### 11.5 Budget Management

**Why it matters:** Planning and controlling spending against a budget is essential for financial discipline.

**Requirements:**
- Create annual/quarterly budgets by department or account
- Budget vs Actual report (variance analysis)
- Alerts when spending approaches budget limit (80%, 95%, 100%)
- Budget approval workflow
- Rolling forecast (reforecast mid-year)

### 11.6 Full Audit Trail & Compliance Reporting

**Why it matters:** Regulators, auditors, and investors need complete traceability of every transaction.

**Requirements:**
- Every create, update, delete action logged with: user, timestamp, IP address, before/after values
- Audit log search by user, date range, action type, record type
- Export audit log for auditors
- FIRS-ready export of all fiscalized invoices for tax audits
- Non-repudiation — logs cannot be deleted or modified
- Compliance calendar alerts (VAT filing, WHT remittance deadlines)

### 11.7 Supplier Management (Full)

**Why it matters:** Beyond purchase orders, businesses need to manage supplier relationships, contracts, and performance.

**Requirements:**
- Full supplier profiles (bank details, TIN, CAC number, category)
- Supplier credit terms (30-day net, etc.)
- Supplier performance rating
- Supplier contract storage (PDF attachment)
- Supplier statement of account
- Supplier portal (similar to customer portal)
- Preferred supplier list
- Supplier risk classification

### 11.8 Approval Workflows

**Why it matters:** Financial controls require that large transactions are approved before processing.

**Requirements:**
- Configurable approval thresholds (e.g., invoices > ₦500,000 need manager approval)
- Multi-level approval chains
- Email and in-app notifications for pending approvals
- Approval history and comments
- Emergency bypass with mandatory audit note
- Applies to: Purchase Orders, Bills, Journal Entries, Stock Adjustments, Refunds

### 11.9 API & Third-Party Integrations

**Why it matters:** Businesses use other tools and need data to flow between them.

**Integrations to build:**

| System | Use Case |
|--------|---------|
| **Shopify / WooCommerce** | Online store orders auto-create invoices in WaysERP |
| **Jumia / Konga** | Marketplace orders flow into inventory and invoicing |
| **Zoho CRM / HubSpot** | Sync contacts and deals |
| **Sage Accounting** | Sync journal entries for businesses using both |
| **Banks (via Open Banking)** | Auto-reconcile bank transactions against accounting records |
| **DHL / FedEx / GIG** | Track shipment status on sales/purchase orders |
| **Google Workspace** | Calendar sync for activities, Drive for document storage |
| **Slack** | Invoice approval notifications, low stock alerts |

**Public API:**
- REST API with full OpenAPI documentation
- API key management (per tenant)
- Webhook support (push events to third-party systems)
- Rate limiting per API key
- Sandbox environment for developers

---

## 12. Phase 4 — AI & Intelligence Layer

*Estimated timeline: 24–36 months post-launch*

### 12.1 AI-Powered Invoice Data Extraction

**Use case:** Upload a supplier's PDF invoice, AI extracts vendor name, items, quantities, prices, and creates a bill automatically.

**Technology:** OCR + LLM (OpenAI GPT-4 Vision or Google Document AI)

**Value:** Eliminates manual data entry for accounts payable — saves 2–4 hours per week for typical SME.

### 12.2 Cash Flow Forecasting

**Use case:** System predicts cash position for next 30/60/90 days based on:
- Scheduled invoice due dates
- Recurring expenses and bills
- Historical patterns
- Seasonality

**Value:** Business owner knows in advance if they will have a cash shortfall and can take action (collect debts faster, delay purchases, arrange credit).

### 12.3 Smart Inventory Replenishment

**Use case:** AI recommends purchase quantities based on:
- Historical sales velocity
- Lead time from each supplier
- Seasonal patterns
- Current stock levels and upcoming sales orders

**Value:** Reduces both stockouts and overstock. Optimal inventory reduces working capital tied up in stock.

### 12.4 Anomaly Detection & Fraud Prevention

**Use case:** System flags unusual transactions automatically:
- Invoice amount unusually high for this customer
- Multiple invoices to same customer on same day
- Stock adjustments at unusual times or by unusual users
- Large payment to a new supplier not on approved list

**Value:** Catches errors and potential fraud before they become problems.

### 12.5 AI Chat Assistant ("WaysBot")

**Use case:** Users can ask natural language questions:
- *"What is my total revenue this quarter?"*
- *"Which product has the fastest stock turnover?"*
- *"Show me all overdue invoices above ₦100,000"*
- *"Who are my top 5 customers by revenue?"*

**Technology:** LLM with function calling to query the database
**Value:** Makes the system accessible to users who would struggle to find information in menus.

### 12.6 Smart Invoice Suggestions

**Use case:** When creating a new invoice for a customer you have invoiced before:
- System pre-suggests the same items from their previous invoice
- Prices auto-populated from last transaction
- Notes from previous invoice context suggested

**Value:** Reduces invoice creation time from minutes to seconds for repeat customers.

### 12.7 Predictive Sales Analytics

**Use case:** Based on CRM pipeline data + historical conversions:
- Predict which leads are most likely to convert
- Recommend next action for each lead
- Forecast monthly sales revenue
- Identify deals at risk of being lost

**Value:** Sales managers can prioritise effort on the highest-probability opportunities.

---

## 13. Monetisation Strategy

### Pricing Tiers

| Plan | Price (NGN/month) | Users | Key Limits | Target Customer |
|------|------------------|-------|------------|-----------------|
| **Starter** | ₦15,000 | 1–3 | 100 invoices/month | Sole trader, freelancer |
| **Growth** | ₦35,000 | 1–10 | 500 invoices/month | Small business |
| **Business** | ₦75,000 | 1–25 | Unlimited invoices | Growing SME |
| **Enterprise** | ₦200,000+ | Unlimited | Multi-branch, API access, SLA | Large company |

### Add-On Modules (Optional)

| Add-On | Price (NGN/month) |
|--------|------------------|
| POS Terminal (per terminal) | ₦8,000 |
| Payroll (per employee) | ₦500 |
| WhatsApp Integration | ₦10,000 |
| Online Payment Gateway | 1.5% per transaction |
| Customer Portal | ₦5,000 |
| Priority Support | ₦15,000 |

### Annual Discount
- Pay annually = 2 months free (16.7% discount)

### Revenue Streams
1. **SaaS Subscription** — Primary revenue
2. **Transaction Fees** — From payment gateway integration
3. **Professional Services** — Setup, training, data migration
4. **API Access** — For developers integrating WaysERP into other systems
5. **Marketplace** — Third-party add-ons sold through WaysERP marketplace (Phase 3)

---

## 14. Success Metrics & KPIs

### Product Metrics

| Metric | Definition | Target (Year 1) |
|--------|-----------|----------------|
| **Monthly Active Users (MAU)** | Unique users who log in at least once per month | 500 |
| **Paying Tenants** | Active paying business subscriptions | 100 |
| **Monthly Recurring Revenue (MRR)** | Total subscription revenue per month | ₦5,000,000 |
| **Invoice Fiscalization Rate** | % of invoices created that are fiscalized | > 85% |
| **Customer Churn Rate** | % of paying customers who cancel per month | < 3% |
| **Net Promoter Score (NPS)** | Would customers recommend us? (-100 to +100) | > 40 |

### Engagement Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Daily Active Users (DAU/MAU)** | How often users return | > 40% |
| **Feature Adoption** | % of tenants using each module | > 60% for invoicing, > 30% for CRM |
| **Time to First Invoice** | Minutes from registration to first invoice created | < 15 minutes |
| **Support Ticket Volume** | Tickets per 100 users per week | < 5 |
| **Fiscalization Success Rate** | % of fiscalize attempts that succeed first try | > 95% |

### Business Metrics

| Metric | Definition | Target (Year 1) |
|--------|-----------|----------------|
| **Annual Recurring Revenue (ARR)** | MRR × 12 | ₦60,000,000 |
| **Customer Acquisition Cost (CAC)** | Marketing spend ÷ new customers | < ₦50,000 |
| **Lifetime Value (LTV)** | Avg revenue per customer × avg lifespan | > ₦500,000 |
| **LTV:CAC Ratio** | Health of growth engine | > 10:1 |

---

## 15. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **FIRS API instability** | High | High | Retry logic, offline queue, fallback to manual IRN entry |
| **FIRS regulatory changes** | Medium | High | Modular fiscalization engine — swappable processors |
| **Competitor with FIRS integration** | Medium | High | First-mover advantage, UX moat, switching cost |
| **Database data loss** | Low | Critical | Multi-region backups, WAL archiving, tested restore procedures |
| **Security breach / data leak** | Low | Critical | Penetration testing, WAF, encryption at rest and transit |
| **Customer TIN errors causing fiscalization failures** | High | Medium | Client-side TIN format validation, clear error messages |
| **Internet connectivity in Nigeria** | High | Medium | Offline POS mode (Phase 2), progressive web app caching |
| **Scale bottleneck at database** | Medium | High | Read replicas, connection pooling, query optimisation |
| **Payment gateway disputes** | Medium | Medium | Multi-gateway support, fallback routing |
| **Staff leaving with customer data knowledge** | Medium | Medium | RBAC, audit logs, data compartmentalisation |

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **2FA** | Two-Factor Authentication — additional login security via one-time code |
| **ACID** | Atomicity, Consistency, Isolation, Durability — database transaction guarantees |
| **API** | Application Programming Interface — how systems talk to each other |
| **ARR** | Annual Recurring Revenue |
| **B2B** | Business-to-Business |
| **CAC** | Customer Acquisition Cost |
| **CAC Registration** | Corporate Affairs Commission — Nigerian company registration body |
| **CBN** | Central Bank of Nigeria |
| **CDN** | Content Delivery Network — fast global delivery of static files |
| **Chart of Accounts** | A categorised list of all accounts used in an accounting system |
| **Churn** | Rate at which customers cancel subscriptions |
| **Credit Note** | Document reducing amount owed by a customer |
| **DAU** | Daily Active Users |
| **Debit Note** | Document increasing amount owed by a customer |
| **DPA** | Data Processing Agreement |
| **ERP** | Enterprise Resource Planning — integrated business management software |
| **FIRS** | Federal Inland Revenue Service — Nigeria's tax authority |
| **Fiscalization** | Legal registration of invoices with FIRS |
| **FIFO** | First In First Out — inventory cost flow assumption |
| **GRN** | Goods Receipt Note — confirmation of received stock |
| **IRN** | Invoice Reference Number — unique FIRS-assigned invoice identifier |
| **JPA** | Java Persistence API — database ORM layer |
| **JWT** | JSON Web Token — secure authentication token format |
| **KPI** | Key Performance Indicator |
| **LTV** | Lifetime Value — total revenue expected from a customer |
| **MAU** | Monthly Active Users |
| **MRR** | Monthly Recurring Revenue |
| **Multi-tenant** | Single platform serving multiple separate businesses |
| **NDPR** | Nigeria Data Protection Regulation |
| **NIP** | Nigeria Interbank Payment — instant bank transfer system |
| **NUBAN** | Nigeria Uniform Bank Account Number — 10-digit Nigerian account standard |
| **ORM** | Object-Relational Mapping — maps database tables to code objects |
| **OTP** | One-Time Password — temporary code for 2FA |
| **PAYE** | Pay As You Earn — employee income tax deducted at source |
| **PFA** | Pension Fund Administrator — manages employee pension contributions |
| **PO** | Purchase Order — formal order to a supplier |
| **POS** | Point of Sale — checkout system for retail transactions |
| **QR Code** | Quick Response Code — scannable barcode on fiscalized invoices |
| **RBAC** | Role-Based Access Control — permissions based on user role |
| **RTO** | Recovery Time Objective — max acceptable system downtime |
| **RPO** | Recovery Point Objective — max acceptable data loss window |
| **SaaS** | Software as a Service — cloud-hosted software sold by subscription |
| **SKU** | Stock Keeping Unit — unique product identifier |
| **SLA** | Service Level Agreement — uptime and support commitments |
| **SME** | Small and Medium Enterprise |
| **SO** | Sales Order — customer's formal purchase order |
| **SSR** | Server-Side Rendering — pages rendered on server before sending to browser |
| **TIN** | Tax Identification Number |
| **TLS** | Transport Layer Security — encryption protocol for HTTPS |
| **VAT** | Value Added Tax — 7.5% in Nigeria |
| **WAF** | Web Application Firewall |
| **WAL** | Write-Ahead Log — database recovery mechanism |
| **WIP** | Work In Progress — services delivered but not yet invoiced |
| **WHT** | Withholding Tax |

---

*Document Status: Living document — updated as product evolves*
*Next Review Date: July 2026*
*Owner: WaysERP Product Team*