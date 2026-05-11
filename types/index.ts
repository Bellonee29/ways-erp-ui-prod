// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface Verify2FARequest {
  email: string
  otpCode: string       // backend field name
}

export interface AuthResponse {
  token: string
  userId: string
  email: string
  role: UserRole        // backend returns role as string e.g. "ADMIN"
  firstName: string
  lastName: string
  organizationName?: string
  requiresPasswordChange: boolean   // backend field name
  tenantId?: string
}

// ─── User ──────────────────────────────────────────────────────────────────────
export type UserRole = 'TENANT_ADMIN' | 'DIVISION_ADMIN' | 'TENANT_USER'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  organizationName?: string
  tin?: string
  role: UserRole
  isActive: boolean
  isApproved: boolean
  mustChangePassword: boolean
  twoFactorEnabled: boolean
  tenantId?: string
  divisionId?: string
  createdAt: string
}

// ─── Division ──────────────────────────────────────────────────────────────────
export interface Division {
  id: string
  name: string
  contactEmail?: string
  country?: string
  parentTenantId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDivisionRequest {
  name: string
  contactEmail?: string
  country?: string
}

export interface CreateDivisionAdminRequest {
  firstName: string
  lastName: string
  email: string
  divisionId: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
}

export interface RegisterRequest {
  email: string
  password: string
  retypePassword: string
  organizationName: string
  domain?: string           // required for root TENANT_ADMIN; omitted for DIVISION_ADMIN
  tin?: string
  businessId?: string       // required for root TENANT_ADMIN; omitted for DIVISION_ADMIN
  serviceId?: string        // required for root TENANT_ADMIN; omitted for DIVISION_ADMIN
  street?: string
  country: string
  postalCode?: string
  phone: string
  businessDescription?: string
  divisionId?: string       // when set + authenticated = creates DIVISION_ADMIN
}

export interface ApproveManagerRequest {
  managerId: string
  approve: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateUserPermissionsRequest {
  permissionIds: string[]
}

export interface UserStats {
  totalUsers?: number
  totalManagers?: number
  totalRegularUsers?: number
  pendingManagers?: number
  activeUsers?: number
  inactiveUsers?: number
  myManagedUsers?: number
}

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

// ─── Tenant ────────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string
  name: string
  organizationName: string
  slug: string
  domain?: string
  country?: string
  plan?: string
  logoUrl?: string
  isActive: boolean
  createdAt: string
}

export interface TenantProfile {
  id: string
  name: string
  domain?: string
  country?: string
  plan?: string
  logoUrl?: string
  isActive: boolean
}

// ─── Invoice ───────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'FISCALIZED' | 'FAILED' | 'CANCELLED'
export type FiscalizationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'REJECTED' | 'PARTIAL_PAYMENT'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  discountAmount: number
  discountPercentage: number
  hsnCode?: string
  taxCategoryId: string
  grossLineTotal: number
  resolvedDiscount: number
  lineTotal: number
  taxAmount: number
  totalAmount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail?: string
  customerAddress?: string
  customerTin?: string
  customerPhone?: string
  invoiceTypeCode: string
  currency: string
  issueDate: string
  dueDate?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: InvoiceStatus
  fiscalizationStatus: FiscalizationStatus
  invoicePaymentStatus?: PaymentStatus
  salesOrderId?: string
  processStage?: string
  irn?: string
  qrCode?: string
  firsValidationCode?: string
  fiscalizationError?: string
  fiscalizedAt?: string
  notes?: string
  items: InvoiceItem[]
  receipt?: string
  createdAt: string
}

export interface CreateInvoiceItemRequest {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
  discountAmount?: number
  discountPercentage?: number
  hsnCode?: string
  taxCategoryId?: string
}

export interface CreateInvoiceRequest {
  customerName: string
  customerEmail?: string
  customerAddress?: string
  customerTin?: string
  customerPhone?: string
  customerCountry?: string
  customerZone?: string
  invoiceTypeCode?: string
  currency?: string
  invoicePaymentStatus?: 'PAID' | 'PENDING'
  issueDate: string
  dueDate?: string
  notes?: string
  salesOrderId?: string
  items: CreateInvoiceItemRequest[]
}

export interface FiscalizationResponse {
  success: boolean
  message: string
  invoiceId: string
  invoiceNumber: string
  irn?: string
  qrCode?: string
  firsValidationCode?: string
  fiscalizedAt?: string
  receiptId?: string
  error?: string
}

// ─── Credit/Debit Notes ────────────────────────────────────────────────────────
export interface CreditDebitNote {
  id: string
  noteType: 'CREDIT' | 'DEBIT'
  reason: string
  totalAmount: number
  status: string
  irn?: string
  createdAt: string
}

// ─── Accounting ────────────────────────────────────────────────────────────────
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'

export interface ChartOfAccount {
  id: string
  code: string
  name: string
  accountType: AccountType
  description?: string
  balance: number
  isActive: boolean
}

export interface CreateChartOfAccountRequest {
  code: string
  name: string
  accountType: AccountType
  description?: string
}

export interface JournalEntry {
  id: string
  entryNumber: string
  description: string
  totalDebit: number
  totalCredit: number
  status: string
  createdAt: string
}

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  balance: number
  currency: string
  isActive: boolean
}

export interface Bill {
  id: string
  vendorName: string
  billNumber: string
  totalAmount: number
  dueDate: string
  paidAmount?: number
  subtotal?: number
  taxAmount?: number
  currency?: string
  notes?: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED'
  createdAt: string
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference?: string
  createdAt: string
}

export interface TrialBalance {
  accounts: Array<{ accountName: string; debit: number; credit: number }>
  totalDebit: number
  totalCredit: number
}

// ─── CRM ───────────────────────────────────────────────────────────────────────
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED'
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'SOCIAL_MEDIA' | 'EMAIL' | 'OTHER'

export interface Contact {
  id: string
  tenantId?: string
  userId?: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  jobTitle?: string
  tin?: string
  address?: string
  country?: string
  postalZone?: string
  companyId?: string
  companyName?: string
  tags?: string
  notes?: string
  isActive?: boolean
  createdAt: string
  updatedAt?: string
}

export interface CrmCompany {
  id: string
  name: string
  industry?: string
  website?: string
  phone?: string
  email?: string
  createdAt: string
}

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  source: LeadSource
  status: LeadStatus
  estimatedValue?: number
  createdAt: string
}

export interface Pipeline {
  id: string
  name: string
  stages: PipelineStage[]
}

export interface PipelineStage {
  id: string
  name: string
  order: number
  deals: Deal[]
}

export interface Deal {
  id: string
  title: string
  value: number
  contactName?: string
  status: 'OPEN' | 'WON' | 'LOST'
  currentStage?: PipelineStage
  createdAt: string
}

export interface CrmActivity {
  id: string
  type: string
  subject: string
  description?: string
  dueDate?: string
  completed: boolean
  createdAt: string
}

// ─── Inventory ─────────────────────────────────────────────────────────────────
export interface ProductCategory {
  id: string
  name: string
  description?: string
}

export interface Product {
  id: string
  tenantId?: string
  name: string
  sku?: string
  barcode?: string
  description?: string
  categoryId?: string
  categoryName?: string
  unitOfMeasure: string       // backend field name
  costPrice: number
  sellingPrice: number        // backend field name (NOT unitPrice)
  taxRate?: number
  trackInventory?: boolean
  reorderPoint?: number       // backend field name (NOT reorderLevel)
  isActive?: boolean
  createdAt: string
}

export interface Warehouse {
  id: string
  name: string
  location: string
  isActive: boolean
}

export interface StockLevel {
  id?: string
  productId: string
  productName: string
  productSku: string
  warehouseId?: string
  warehouseName: string
  quantityOnHand: number
  quantityReserved?: number
  quantityAvailable?: number
  reorderPoint?: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorName: string
  vendorEmail?: string
  warehouseId?: string
  warehouseName?: string
  subtotal?: number
  taxAmount?: number
  totalAmount: number
  currency?: string
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  orderDate?: string
  expectedDate?: string
  notes?: string
  tenantId?: string
  createdAt: string
  updatedAt?: string
}

export interface StockMovement {
  id: string
  tenantId?: string
  userId?: string
  productId?: string
  productName?: string
  sku?: string
  warehouseId?: string
  warehouseName?: string
  movementType?: string   // STOCK_IN | STOCK_OUT | TRANSFER_IN | TRANSFER_OUT | ADJUSTMENT | WRITE_OFF
  quantity: number
  unitCost?: number
  reference?: string
  reason?: string
  createdAt: string
}

export interface SalesOrderLine {
  id: string
  productId: string
  productName: string
  quantity: number
  fulfilledQuantity: number
  unitPrice: number
  taxRate: number
  discountAmount: number
  lineTotal: number
}

export interface SalesOrder {
  id: string
  soNumber: string
  orderNumber?: string
  customerName: string
  customerEmail?: string
  warehouseId?: string
  warehouseName?: string
  currency: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED'
  linkedInvoiceId?: string
  orderDate: string
  expectedDate?: string
  notes?: string
  lines: SalesOrderLine[]
  createdAt: string
}

// ─── Shared ────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp?: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export interface PageParams {
  page?: number
  size?: number
}