# WaysERP — User Guide
### How to Use the System (Simple English for Everyone)

**Version 1.0 | April 2026**
**Prepared by: WaysERP Team**

---

## Table of Contents

1. [What is WaysERP?](#1-what-is-wayserp)
2. [Getting Started — How to Log In](#2-getting-started--how-to-log-in)
3. [The Dashboard — Your Business at a Glance](#3-the-dashboard--your-business-at-a-glance)
4. [Invoices — Billing Your Customers](#4-invoices--billing-your-customers)
5. [CRM — Managing Your Customers & Leads](#5-crm--managing-your-customers--leads)
6. [Inventory — Managing Your Products & Stock](#6-inventory--managing-your-products--stock)
7. [Accounting — Tracking Your Money](#7-accounting--tracking-your-money)
8. [Settings — Your Profile & Company Setup](#8-settings--your-profile--company-setup)
9. [Users & Teams — Managing Who Can Access the System](#9-users--teams--managing-who-can-access-the-system)
10. [Frequently Asked Questions](#10-frequently-asked-questions)
11. [Glossary — Words You Should Know](#11-glossary--words-you-should-know)

---

## 1. What is WaysERP?

**WaysERP** is a business management software designed to help Nigerian businesses run more smoothly. Think of it as a digital office that handles:

- **Invoicing** — Creating bills for your customers and sending them to the government (FIRS)
- **Customer Management** — Keeping track of all your clients and potential customers
- **Inventory** — Knowing what products you have and how much stock is left
- **Accounting** — Tracking your income, expenses, and bank accounts
- **Team Management** — Controlling who in your company can do what

### Who is it for?
- Small and medium-sized businesses
- Retailers and distributors
- Service providers
- Companies with multiple branches
- Any business that needs to issue government-compliant invoices in Nigeria

### Why do I need it?
The Nigerian government (through FIRS — Federal Inland Revenue Service) requires businesses to:
- Issue official invoices with unique reference numbers (IRN)
- Include VAT on all applicable transactions
- Submit invoice records electronically

WaysERP does all of this automatically for you — you just fill in the details and click a button.

---

## 2. Getting Started — How to Log In

### Step 1: Open the System
Open your web browser (Chrome, Firefox, or Edge) and go to your company's WaysERP address.

### Step 2: Enter Your Login Details
You will see a login page. Enter:
- **Email Address** — The email your administrator gave you
- **Password** — Your password (your administrator will give you a temporary one)

Click the **"Sign In"** button.

### Step 3: Two-Factor Verification (2FA)
For your security, the system will send a **6-digit code** to your email after you enter your password.

- Check your email inbox for a message from WaysERP
- Enter the 6-digit code on the screen
- Click **"Verify"**

> **What is 2FA?** It is an extra security step. Even if someone steals your password, they cannot log in without the code sent to your email. Think of it like an ATM card — you need both the card AND your PIN.

### Step 4: Change Your Password (First Login Only)
If this is your first time logging in, the system will ask you to change your password.

- Enter your temporary password in the "Current Password" field
- Enter a new password you will remember
- Enter the new password again to confirm
- Click **"Change Password"**

**Password rules:**
- At least 8 characters long
- Mix of letters and numbers is recommended
- Do NOT use obvious passwords like "password123" or your name

### Step 5: You're In!
You will now see your dashboard — the main screen of WaysERP.

---

## 3. The Dashboard — Your Business at a Glance

The Dashboard is the first screen you see after logging in. It is like a car dashboard — it shows you the most important information at a glance without you needing to go anywhere.

### What You Will See

#### Top Banner
The green banner at the top shows:
- A personalised greeting ("Good morning, [Your Name]")
- Today's date
- A green "Live" indicator showing the system is connected

#### Key Numbers (KPI Cards)
Four coloured boxes show your most important business numbers:

| Box | What it means |
|-----|---------------|
| **Total Revenue** | How much money you have earned from completed (fiscalized) invoices |
| **Outstanding** | Money customers owe you (invoices not yet paid or processed) |
| **Pipeline Value** | The total potential value of all deals you are working to close |
| **Low Stock Items** | How many products are running low in your warehouse |

> **Click on any box** to go directly to that section of the system.

#### Small Summary Numbers
Below the main boxes, you see four smaller figures:
- Total invoices issued
- Total users in your system
- How many invoices were fiscalized (sent to FIRS)
- How many invoices failed

#### Recent Invoices
The main section on the left shows your most recent invoices — who they were for, the amount, and whether they have been processed.

#### Revenue Chart
A bar chart showing your fiscalized revenue month by month for the last 6 months. Taller bar = more revenue that month.

#### Quick Actions
Four shortcuts for the most common tasks:
- **New Invoice** — Create a new invoice
- **Add Product** — Add a product to your catalog
- **New Lead** — Record a new potential customer
- **Add User** — Create a new system user

#### Low Stock Alerts
If any products are running below their safe minimum level, a red alert box appears showing which products need restocking.

#### Lead Funnel
A bar showing how your potential customers (leads) are spread across different stages — from first contact to being converted into paying customers.

#### Team Summary (Admin only)
If you are an administrator, you see a summary of your team: total users, managers, active accounts, and anyone waiting for approval.

---

## 4. Invoices — Billing Your Customers

The Invoices section is one of the most important parts of WaysERP. This is where you create bills for your customers and submit them to the Nigerian government (FIRS).

### Understanding Invoice Status

Every invoice has a status that tells you where it is in the process:

| Status | What it means |
|--------|---------------|
| **DRAFT** | Invoice created but not yet sent to FIRS. You can still edit or delete it. |
| **FISCALIZED** | Invoice has been sent to FIRS and received an official reference number (IRN). This is the final state. |
| **FAILED** | Something went wrong when sending to FIRS. You need to try again. |
| **CANCELLED** | Invoice has been cancelled. |

### How to Create a New Invoice

1. Click **"New Invoice"** (the green button in the top right of the Invoices page)
2. A form will appear. Fill in the following:

**Customer Section:**
- **Customer Name** — The name of the person or company you are billing (required)
- **Customer Email** — Their email address (optional but recommended)
- **Customer Phone** — Their phone number (optional)
- **Customer TIN** — Their Tax Identification Number (important for VAT compliance)
- **Customer Address** — Their billing address

> **Tip:** If this customer is already in your CRM Contacts list, click the **"Select Contact"** button to auto-fill all their details automatically.

**Invoice Details:**
- **Currency** — NGN (Nigerian Naira) is the default
- **Invoice Type** — Usually "Standard Invoice"
- **Issue Date** — Today's date (auto-filled)
- **Due Date** — When payment is expected

**Line Items (What you are selling):**
Click **"+ Add Item"** for each product or service you are billing.
For each item:
- **Description** — What the product or service is
- **Quantity** — How many units
- **Unit Price** — Price per unit
- **Tax Rate** — Usually 7.5% (Nigerian VAT rate)
- **Discount** — Any discount amount (optional)

The system automatically calculates:
- Line total per item
- Subtotal (before tax)
- VAT amount
- **Total Amount Due**

3. Click **"Create Invoice"** when done.

### How to Fiscalize an Invoice (Send to FIRS)

Fiscalization means sending the invoice to the Nigerian Federal Inland Revenue Service (FIRS) for official registration. This is required by law.

**Step 1:** Find the invoice you want to fiscalize in the table.

**Step 2:** Click the **lightning bolt (⚡) icon** in the Actions column.

**Step 3:** Wait a few seconds. The system will:
1. Generate a unique Invoice Reference Number (IRN)
2. Validate the invoice data
3. Apply a digital signature
4. Generate a QR code
5. Register it with FIRS

**Step 4:** If successful, the invoice status changes to **FISCALIZED** (shown in green). You will see:
- **IRN** — A unique government reference number
- **Validation Code** — From FIRS
- **Fiscalized timestamp** — When it was registered

> **Important:** Once an invoice is fiscalized, you **cannot edit or delete it**. This is a legal requirement. If you made a mistake, you must create a **Credit Note** (see below).

### Fiscalizing Multiple Invoices at Once (Bulk Fiscalization)

If you have many draft invoices, you can process them all at once:

1. Tick the checkboxes on the left side of each draft invoice you want to fiscalize
2. (Or tick the checkbox in the header row to select ALL drafts)
3. A **"Fiscalize X Selected"** button will appear
4. Click it — the system processes them one by one and tells you how many succeeded

### Previewing an Invoice

Before fiscalizing, you can preview what the invoice looks like:

1. Click the **eye (👁) icon** in the Actions column
2. A detailed preview appears showing all invoice information
3. From the preview, you can:
   - **Download PDF** — Save or print the invoice
   - **Fiscalize Invoice** — Send to FIRS directly from the preview

### Downloading an Invoice PDF

- Click the **document icon (📄)** in the Actions column
- A PDF file will download to your computer
- The PDF includes your company logo (if uploaded), all invoice details, and FIRS information if fiscalized

### Downloading a Receipt

After an invoice is fiscalized, a receipt is generated by FIRS. To download it:
- Click the **download (⬇) icon** in the Actions column
- This only appears on fiscalized invoices

### Credit Notes and Debit Notes

A **Credit Note** reduces the amount a customer owes (e.g., for returned goods or overbilling).
A **Debit Note** increases the amount a customer owes (e.g., for additional charges missed on the original invoice).

**When do I use these?**
- Customer returned some goods → Create a **Credit Note**
- You forgot to include some items on an invoice → Create a **Debit Note**
- You overcharged a customer → Create a **Credit Note**

**How to create one:**
1. Find the fiscalized invoice in the table
2. Click the **FileMinus icon (credit note)** or **FilePlus icon (debit note)** in Actions
3. Fill in the form:
   - **Note Type** — Credit or Debit
   - **Issue Date** — Today's date
   - **Reason** — Why you are issuing this note (required)
   - **Line Items** — What is being returned/added
4. Click **"Create Credit/Debit Note"**

> **Note:** Credit/Debit Notes can only be created on fiscalized invoices, not drafts.

### Updating Payment Status

Once a customer pays their invoice:
1. Find the invoice in the table
2. Click the payment status option
3. Change status to **PAID**

This updates the record in FIRS as well.

---

## 5. CRM — Managing Your Customers & Leads

CRM stands for **Customer Relationship Management**. This section helps you track everyone you do business with — current customers, potential customers, and all your interactions with them.

The CRM has five sections (tabs):

### 5.1 Contacts — Your Customer Directory

Think of Contacts as your digital address book, but smarter.

**What information do you store?**
- Full name
- Email address
- Phone number
- Job title
- Company name
- TIN (Tax ID — used when creating invoices)
- Address (also used on invoices)
- Tags (labels like "VIP", "Wholesale", "Government")
- Notes (private internal comments)

**How to add a new contact:**
1. Click **"New Contact"**
2. Fill in the details (at minimum, the first name is required)
3. Click **"Save Contact"**

> **Pro Tip:** Add your customers' TIN and Address here. When you create an invoice and select this contact, all their details will fill in automatically — saving you time!

**How to find a contact:**
Use the search box at the top — type any part of their name or email and the list filters instantly.

**How to edit or delete:**
Hover over any contact card — edit (pencil) and delete (bin) icons appear in the corner.

### 5.2 Companies — Business Organisations

While Contacts are individual people, Companies are the organisations they work for. You can link contacts to companies.

**What you track:**
- Company name
- Industry (e.g., Manufacturing, Retail, Government)
- Website
- Phone and email

### 5.3 Leads — Potential Customers

A **Lead** is someone who might become a customer but has not bought from you yet. Think of it as a prospect.

**Lead Stages (the journey from stranger to customer):**

| Stage | Meaning |
|-------|---------|
| **NEW** | Just captured — no contact made yet |
| **CONTACTED** | You have reached out to them |
| **QUALIFIED** | They are genuinely interested and can afford your service |
| **UNQUALIFIED** | They are not a good fit or cannot afford it |
| **CONVERTED** | They became a paying customer! |

**How to move a lead through stages:**
In the leads table, you will see action buttons for each lead:
- Click **"Contact"** to mark them as contacted
- Click **"Qualify"** to mark them as qualified
- Click **"Convert"** to convert them into a customer

**Lead Funnel Summary:** At the top of the Leads tab, you see coloured boxes showing how many leads are in each stage. Click any box to filter the list to just that stage.

**How to add a lead:**
1. Click **"New Lead"**
2. Fill in their name, contact details, company, and estimated deal value
3. Select how you found them (Lead Source): Website, Referral, Social Media, Email Campaign, or Other
4. Click **"Create Lead"**

### 5.4 Pipeline — Tracking Deals in Progress

The Pipeline is a visual board (like sticky notes on a wall) showing all your active deals and what stage they are at.

**How it works:**
- Deals move left to right through stages (e.g., Proposal → Negotiation → Closing)
- Each column represents a stage
- Each card represents a deal with the customer name and deal value
- At the top you can see the **total pipeline value** (all the money you could earn if every deal closes)

**How to create a deal:**
1. Click **"New Deal"**
2. Enter the deal title, value, customer name, and select which pipeline and stage it belongs to
3. Click **"Create Deal"**

**Closing a deal:**
On each deal card, you will see two buttons:
- **Won** — The customer agreed and the deal is closed successfully 🎉
- **Lost** — The deal did not close

### 5.5 Activities — Logging What You Did

Activities are records of everything you do with customers — calls made, emails sent, meetings held, etc.

**Types of activities you can log:**
- Phone Call
- Email
- Meeting
- Demo / Presentation
- Follow-up
- Note

**Why log activities?**
- Remember what was discussed
- See the full history of communication with each customer
- Never miss a follow-up
- Train new staff on how to handle accounts

**How to log an activity:**
1. Click **"Log Activity"**
2. Select the type (call, email, meeting, etc.)
3. Enter the subject (brief summary)
4. Add due date if it is a task to be done
5. Add detailed description
6. Click **"Log Activity"**

When the activity is done, click **"Mark complete"** to close it.

---

## 6. Inventory — Managing Your Products & Stock

The Inventory section helps you know what products you sell, how much you have in stock, and when to reorder.

It has five tabs:

### 6.1 Products — Your Product Catalogue

This is a list of everything you sell.

**Information stored per product:**
- **Name** — What the product is called
- **SKU** — Stock Keeping Unit (a unique code you assign, like "RICE-5KG-001")
- **Barcode** — The barcode number on the product packaging
- **Category** — What type of product it is
- **Unit of Measure** — How it is sold (PCS = pieces, KG = kilograms, LTR = litres, etc.)
- **Cost Price** — What you paid to buy or make it
- **Selling Price** — What you charge customers
- **VAT Rate** — Tax percentage (usually 7.5%)
- **Reorder Point** — The minimum quantity before you need to restock

**How to add a product:**
1. Click **"Add Product"**
2. Fill in at minimum: name, unit of measure, cost price, selling price
3. Set a reorder point so the system can warn you when stock is low
4. Click **"Save Product"**

**Tip:** The system uses selling price when creating sales orders, and cost price for inventory valuation reports.

### 6.2 Stock Levels — How Much You Have

This tab shows the **current quantity** of each product in each warehouse.

**Traffic light system:**
- **Green "In Stock"** — You have enough stock
- **Red "Low Stock"** — Stock has fallen below the reorder point — you need to restock!

**Adjusting Stock (Stocktake Correction):**
Sometimes your physical count does not match the system — a product might have been damaged, miscounted, or incorrectly recorded. To correct this:

1. Click **"Adjust Stock"**
2. Select the product
3. Select the warehouse
4. Enter the **correct quantity** (this is the final actual count, not an amount to add or remove)
5. Select a reason (Stocktake, Damaged, Returned, Correction, Other)
6. Click **"Apply Adjustment"**

> All adjustments are permanently recorded for audit purposes. You cannot delete stock adjustments.

### 6.3 Warehouses — Your Storage Locations

A warehouse is any physical location where you store goods — your main store, a branch, a storage facility, etc.

You can have multiple warehouses and track stock separately in each.

**How to add a warehouse:**
1. Click **"Add Warehouse"**
2. Enter the warehouse name (e.g., "Main Store Lagos Island")
3. Enter the full address
4. Click **"Save Warehouse"**

### 6.4 Purchase Orders — Buying from Suppliers

A **Purchase Order (PO)** is a formal document you send to your supplier saying "I want to buy X quantity of Y product at Z price."

**Purchase Order Lifecycle:**

```
DRAFT → CONFIRMED → RECEIVED → (done)
         ↓
      CANCELLED
```

| Status | Meaning |
|--------|---------|
| **DRAFT** | PO created but not sent to supplier yet |
| **CONFIRMED** | Supplier has accepted the order |
| **RECEIVED** | Goods have arrived — stock is automatically added to your warehouse |
| **CANCELLED** | Order was cancelled |

**How to create a Purchase Order:**
1. Click **"New Purchase Order"**
2. Enter supplier name and email
3. Select destination warehouse (where goods will be stored when they arrive)
4. Set the order date and expected delivery date
5. Add line items: product, description, quantity, and unit price
6. Click **"Create PO"**

**When goods arrive:**
Click the **"Receive"** button on the PO — the system automatically adds the received quantities to your warehouse stock.

### 6.5 Sales Orders — Selling to Customers

A **Sales Order (SO)** is used when a customer places a bulk order that needs to be fulfilled from your warehouse (different from a sales invoice which is for payment).

**Sales Order Lifecycle:**

```
DRAFT → CONFIRMED → FULFILLED → (done)
         ↓
      CANCELLED
```

**When you fulfil a sales order:**
Click **"Fulfill"** — the system automatically deducts the sold quantities from your warehouse stock.

---

## 7. Accounting — Tracking Your Money

The Accounting section helps you track all financial transactions in your business. Even if you have an accountant, this section keeps everything organised and transparent.

It has six sections (tabs):

### 7.1 Overview — Financial Snapshot

The first thing you see when you open Accounting. It shows:

**Four key numbers:**
- **Total Assets** — Everything you own (cash, stock, equipment, etc.) in money value
- **Net Income** — Revenue minus expenses (if positive, you are making profit; if negative, you are at a loss)
- **Bank Balance** — Total money across all your linked bank accounts
- **Pending Bills** — Money you owe to suppliers that has not been paid yet

**Balance by Account Type** — A visual bar chart showing your financial breakdown.

**Bank Accounts** — Quick view of your account balances.

**Recent Bills** — Bills awaiting payment.

### 7.2 Chart of Accounts — Your Financial Filing System

A **Chart of Accounts** is like a filing system for all your financial transactions. Every transaction in your business gets categorised into an account.

**Account Types:**

| Type | What it means | Examples |
|------|---------------|---------|
| **ASSET** | Things you own | Cash, Bank Account, Stock, Equipment |
| **LIABILITY** | Money you owe | Loans, Unpaid Bills, Tax Payable |
| **EQUITY** | Owner's share | Capital invested, Retained profit |
| **REVENUE** | Money earned | Sales, Service fees |
| **EXPENSE** | Money spent | Rent, Salaries, Utilities |

**Account Codes:**
Each account has a number code. Standard Nigerian practice:
- 1000–1999: Assets
- 2000–2999: Liabilities
- 3000–3999: Equity
- 4000–4999: Revenue
- 5000–5999: Expenses

**How to add an account:**
1. Click **"Add Account"**
2. Enter a unique code (e.g., "1001")
3. Select the type (Asset, Liability, etc.)
4. Enter a clear name (e.g., "Cash at Hand")
5. Add a description if needed
6. Click **"Save Account"**

### 7.3 Journal Entries — The Accounting Record Book

Every financial transaction creates a **journal entry**. This is the core of accounting — the double-entry bookkeeping system where every debit has an equal credit.

> **Don't worry if this sounds technical.** Most journal entries are created automatically by the system when you create invoices, receive goods, or pay bills. You only need to create manual journal entries for special adjustments.

**What "Balanced" means:**
For every journal entry, the total Debit must equal the total Credit. If they don't match, the system shows "Unbalanced" — this needs to be corrected.

### 7.4 Bills — Money You Owe Suppliers

A **Bill** is an invoice you received from a supplier (as opposed to an invoice you sent to a customer).

**Bill Lifecycle:**
```
DRAFT → PENDING → APPROVED → PAID
```

**Overdue Bills:**
If a bill's due date has passed and it is not paid, the system highlights it in red with "(Overdue)" warning.

**How to create a bill:**
1. Click **"New Bill"**
2. Enter vendor name, their bill/invoice number, amount, and due date
3. Click **"Create Bill"**

**Approving and paying bills:**
- Click **"Approve"** when you have confirmed the bill is correct
- Click **"Mark Paid"** when you have actually made the payment

### 7.5 Bank Accounts — Your Money in the Bank

Link all your company bank accounts here to track your cash position.

**How to add a bank account:**
1. Click **"Add Bank Account"**
2. Enter bank name (e.g., "Zenith Bank")
3. Enter account name (the name on the account)
4. Enter the 10-digit account number
5. Select currency (NGN, USD, GBP, EUR)
6. Click **"Save Account"**

> The balance shown comes from your accounting records, not directly from the bank. Always reconcile periodically.

### 7.6 Reports — Financial Statements

**Profit & Loss Report:**
Shows whether your business is making money.
- Revenue (money in) minus Expenses (money out) = **Net Profit or Loss**
- Green = profit (good!) | Red = loss (needs attention)

**Balance Sheet Summary:**
A snapshot of your business's financial position:
- **Total Assets** — What you own
- **Total Liabilities** — What you owe
- **Net Worth (Equity)** — Assets minus Liabilities = what belongs to the owners

**Trial Balance:**
A list of all accounts with their debit and credit balances. Used by accountants to verify that books balance. The system automatically checks and shows "Balanced" or "Out of balance" with the exact difference.

---

## 8. Settings — Your Profile & Company Setup

Access Settings by clicking **"Settings"** in the left sidebar.

### 8.1 My Profile Tab

**What you can change:**
- **First Name** and **Last Name** — How your name appears in the system
- **Phone Number** — Your contact number

**What you cannot change yourself:**
- Email address (contact your administrator)
- Your role (Admin, Manager, or User)

**How to update your profile:**
1. Edit the fields you want to change
2. Click **"Save Changes"**

**Your account details** — shown at the bottom: your role, organisation, country, and subscription plan.

### 8.2 Security Tab (Password)

**How to change your password:**
1. Enter your **current password** to confirm who you are
2. Enter your **new password**
3. Enter the new password again to confirm
4. Click **"Update Password"**

**Password Strength Meter:**
As you type your new password, a bar shows how strong it is:
- 🔴 **Weak** — Easy to guess, not safe
- 🟡 **Fair** — Better but could be stronger
- 🟡 **Good** — Reasonably secure
- 🟢 **Strong** — Excellent! Hard to crack

**What makes a strong password?**
- At least 8 characters (the longer the better)
- Mix of UPPERCASE and lowercase letters
- Include numbers
- Include special characters (!, @, #, etc.)

> After changing your password, you will be logged out automatically. Log back in with your new password.

### 8.3 Company Logo Tab

Upload your company logo here. Your logo will appear on:
- Invoice PDFs
- Receipts sent to customers
- All printed documents

**How to upload a logo:**
1. Click the upload area (or drag and drop your image file onto it)
2. Select your logo image (PNG, JPG, or SVG format, maximum 2MB)
3. A preview appears showing what it looks like
4. Click **"Upload"**

**Tips for a good logo:**
- Use PNG format with a transparent background for best results
- Minimum size: 256×256 pixels
- Keep it under 2MB file size
- Square or horizontal logos work best

---

## 9. Users & Teams — Managing Who Can Access the System

*(This section is for Administrators only)*

### User Roles — Who Can Do What

WaysERP has three levels of access:

| Role | Who they are | What they can do |
|------|-------------|-----------------|
| **ADMIN** | Business owner or IT manager | Everything — full access to all features |
| **MANAGER** | Department heads, supervisors | Create invoices, manage CRM, view reports; cannot manage other users |
| **USER** | Regular staff | Create invoices and basic operations only |

### How to Create a New User

1. Go to **Users** in the sidebar
2. Click **"Add User"**
3. Enter their:
   - First name and last name
   - Email address
4. Click **"Create User"**
5. The new user will receive an email with a temporary password and instructions to log in

### Approving Managers

When someone registers as a Manager, an administrator must **approve** their account before they can use the system.

**How to approve a manager:**
1. Go to the **Users** page
2. You will see users with "Pending Approval" status
3. Click **"Approve"** next to their name
4. They can now log in

### Managing Permissions

You can give users access to specific features without changing their full role.

1. Find the user in the Users list
2. Click the settings/permissions icon
3. Check or uncheck specific permissions
4. Save changes

---

## 10. Frequently Asked Questions

**Q: I forgot my password. What do I do?**
A: On the login page, click "Forgot Password" and enter your email. You will receive instructions to reset it. If you don't see the link, contact your administrator.

---

**Q: I made a mistake on a fiscalized invoice. Can I fix it?**
A: No — fiscalized invoices cannot be edited. This is a legal requirement. Instead, create a Credit Note (if you overbilled) or Debit Note (if you underbilled) to correct the amount.

---

**Q: What does "FIRS" mean?**
A: FIRS stands for Federal Inland Revenue Service — Nigeria's tax authority. When you fiscalize an invoice, WaysERP sends it to FIRS and gets back an official reference number (IRN) that proves the invoice is legal and registered.

---

**Q: What is an IRN?**
A: IRN stands for Invoice Reference Number. It is a unique code assigned by FIRS to every fiscalized invoice. Keep this number for your records.

---

**Q: Why is my invoice showing "FAILED"?**
A: Fiscalization failed — usually because of:
- Network connection issue (try again)
- Incorrect customer TIN format
- FIRS server was temporarily unavailable (try again later)
Click the lightning bolt icon again to retry.

---

**Q: Can I use the system on my phone?**
A: Yes! WaysERP works in any web browser on phones, tablets, and computers. For best experience, use Chrome or Firefox on your phone.

---

**Q: How do I know if my invoice was sent to FIRS successfully?**
A: The invoice status will change from "DRAFT" to "FISCALIZED" and you will see an IRN number on the invoice. You can also click the eye icon to preview the invoice and see the FIRS details section.

---

**Q: What is the difference between a Purchase Order and an Invoice?**
A: A **Purchase Order** is what you send to a *supplier* when you are buying goods. An **Invoice** is what you send to a *customer* when they are buying from you.

---

**Q: How do I add VAT to an invoice?**
A: When adding line items to an invoice, there is a "Tax Rate" field. Enter 7.5 for Nigerian standard VAT. The system calculates VAT automatically and adds it to the total.

---

**Q: My stock levels look wrong. What do I do?**
A: Go to Inventory → Stock Levels → Click "Adjust Stock". Select the product, enter the correct quantity, and select "Stocktake" as the reason. This corrects the record.

---

## 11. Glossary — Words You Should Know

| Word | Simple Explanation |
|------|-------------------|
| **2FA** | Two-Factor Authentication — a second security check (code sent to your email) when logging in |
| **Balance Sheet** | A snapshot showing what your business owns, owes, and is worth |
| **Chart of Accounts** | A filing system that categorises every financial transaction |
| **Credit Note** | A document that reduces what a customer owes you (like a refund) |
| **Dashboard** | The home screen showing your key business numbers at a glance |
| **Debit Note** | A document that increases what a customer owes you |
| **FIRS** | Federal Inland Revenue Service — Nigeria's tax authority |
| **Fiscalization** | The process of registering an invoice with FIRS to make it legally valid |
| **GRN** | Goods Receipt Note — confirmation that goods were received from a supplier |
| **Invoice** | A bill sent to a customer requesting payment for goods or services |
| **IRN** | Invoice Reference Number — the unique code FIRS gives to a registered invoice |
| **KPI** | Key Performance Indicator — an important business measurement |
| **Lead** | A potential customer who has not yet purchased from you |
| **P&L** | Profit & Loss — a report showing income versus expenses |
| **Pipeline** | The stages a potential deal goes through from first contact to closing |
| **PO** | Purchase Order — an order placed with a supplier to buy goods |
| **SKU** | Stock Keeping Unit — a unique code you assign to identify a product |
| **SO** | Sales Order — a customer's order for goods from your warehouse |
| **TIN** | Tax Identification Number — a unique number assigned to taxpayers by FIRS |
| **VAT** | Value Added Tax — Nigeria's standard tax rate is 7.5% |
| **Warehouse** | A physical location where you store inventory |

---

*For technical support, contact your system administrator.*
*WaysERP Version 1.0 — April 2026*