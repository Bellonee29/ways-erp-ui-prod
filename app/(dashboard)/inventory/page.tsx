'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, AlertTriangle, Package, Warehouse as WarehouseIcon,
  TruckIcon, ClipboardList, Edit2, Trash2,
  ArrowUpDown, CheckCircle2, XCircle, Search, BarChart3,
  Tag as TagIcon, FolderOpen, FileText, UserCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { inventoryApi } from '@/lib/api/inventory'
import { accountingApi } from '@/lib/api/accounting'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api/client'
import { Card, CardHeader } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonRows } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input, { Select } from '@/components/ui/Input'
import { crmApi } from '@/lib/api/crm'
import type { Product, Warehouse, ProductCategory, Contact } from '@/types'

const today = new Date().toISOString().slice(0, 10)

/* ── Schemas ── */
const categorySchema = z.object({
  name:        z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
})
type CategoryForm = z.infer<typeof categorySchema>

const productSchema = z.object({
  name:                     z.string().min(1, 'Product name is required'),
  sku:                      z.string().optional(),
  barcode:                  z.string().optional(),
  description:              z.string().optional(),
  categoryId:               z.string().optional(),
  unitOfMeasure:            z.string().min(1, 'Unit is required'),
  sellingPrice:             z.coerce.number().positive('Must be > 0'),
  costPrice:                z.coerce.number().positive('Must be > 0'),
  taxRate:                  z.coerce.number().min(0).default(7.5),
  reorderPoint:             z.coerce.number().min(0).default(5),
  trackInventory:           z.boolean().default(true),
  initialStock:             z.coerce.number().min(0).default(0).optional(),
  initialStockWarehouseId:  z.string().optional(),
  expiryDate:               z.string().optional(),
})
type ProductForm = z.infer<typeof productSchema>

const transferSchema = z.object({
  productId:       z.string().min(1, 'Select a product'),
  fromWarehouseId: z.string().min(1, 'Select source warehouse'),
  toWarehouseId:   z.string().min(1, 'Select destination warehouse'),
  quantity:        z.coerce.number().positive('Must be > 0'),
  reason:          z.string().optional(),
})
type TransferForm = z.infer<typeof transferSchema>

const warehouseSchema = z.object({
  name:     z.string().min(1, 'Warehouse name required'),
  location: z.string().optional(),
  address:  z.string().optional(),
})
type WarehouseForm = z.infer<typeof warehouseSchema>

const adjustSchema = z.object({
  productId:   z.string().min(1, 'Select a product'),
  warehouseId: z.string().min(1, 'Select a warehouse'),
  newQuantity: z.coerce.number().min(0, 'Must be ≥ 0'),
  reason:      z.string().min(1, 'Reason is required'),
})
type AdjustForm = z.infer<typeof adjustSchema>

const poLineSchema = z.object({
  productId:      z.string().min(1, 'Select product'),
  quantity:       z.coerce.number().positive('Must be > 0'),
  unitPrice:      z.coerce.number().min(0).default(0),
  taxRate:        z.coerce.number().min(0).default(7.5),
  discountAmount: z.coerce.number().min(0).default(0),
  taxIncluded:    z.boolean().default(false),
})
const poSchema = z.object({
  vendorName:    z.string().min(1, 'Vendor name required'),
  vendorEmail:   z.string().email('Invalid email').optional().or(z.literal('')),
  warehouseId:   z.string().min(1, 'Select warehouse'),
  orderDate:     z.string().min(1, 'Required'),
  expectedDate:  z.string().optional(),
  currency:      z.string().default('NGN'),
  notes:         z.string().optional(),
  lines:         z.array(poLineSchema).min(1, 'Add at least one item'),
})
type POForm = z.infer<typeof poSchema>

const soLineSchema = z.object({
  productId:      z.string().min(1, 'Select product'),
  quantity:       z.coerce.number().positive('Must be > 0'),
  unitPrice:      z.coerce.number().min(0).default(0),
  taxRate:        z.coerce.number().min(0).default(7.5),
  discountAmount: z.coerce.number().min(0).default(0),
})
const soSchema = z.object({
  customerName:  z.string().min(1, 'Customer name required'),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  warehouseId:   z.string().min(1, 'Select warehouse'),
  orderDate:     z.string().min(1, 'Required'),
  expectedDate:  z.string().optional(),
  currency:      z.string().default('NGN'),
  notes:         z.string().optional(),
  lines:         z.array(soLineSchema).min(1, 'Add at least one item'),
})
type SOForm = z.infer<typeof soSchema>

type Tab = 'products' | 'categories' | 'stock' | 'warehouses' | 'purchase-orders' | 'sales-orders' | 'reports'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'products',        label: 'Products',         icon: Package        },
  { key: 'categories',      label: 'Categories',       icon: TagIcon        },
  { key: 'stock',           label: 'Stock Levels',     icon: BarChart3      },
  { key: 'warehouses',      label: 'Warehouses',       icon: WarehouseIcon  },
  { key: 'purchase-orders', label: 'Purchase Orders',  icon: TruckIcon      },
  { key: 'sales-orders',    label: 'Sales Orders',     icon: ClipboardList  },
  { key: 'reports',         label: 'Movement Reports', icon: ArrowUpDown    },
]

export default function InventoryPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [tab, setTab]                      = useState<Tab>('products')
  const [showNewProduct,   setShowNewProduct]   = useState(false)
  const [showNewWarehouse, setShowNewWarehouse] = useState(false)
  const [showNewCategory,  setShowNewCategory]  = useState(false)
  const [showAdjust,       setShowAdjust]       = useState(false)
  const [showTransfer,     setShowTransfer]     = useState(false)
  const [showNewPO,        setShowNewPO]        = useState(false)
  const [showNewSO,          setShowNewSO]          = useState(false)
  const [soContactSearch,    setSoContactSearch]    = useState('')
  const [soSelectedContact,  setSoSelectedContact]  = useState<Contact | null>(null)
  const [showSOContactPicker, setShowSOContactPicker] = useState(false)
  const [reportTypeFilter, setReportTypeFilter] = useState('')
  const [reportProductFilter, setReportProductFilter] = useState('')
  const [editProduct,   setEditProduct]   = useState<Product | null>(null)
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null)
  const [editCategory,  setEditCategory]  = useState<ProductCategory | null>(null)
  const [productSearch, setProductSearch] = useState('')

  /* ── Queries ── */
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', productSearch],
    queryFn: () => (
      productSearch.length >= 2
        ? inventoryApi.searchProducts(productSearch, { page: 0, size: 50 })
        : inventoryApi.getProducts({ page: 0, size: 50 })
    ).then((r) => r.data.data),
  })

  // Backend returns List (not Page) — use data directly, not .content
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => inventoryApi.getCategories().then((r) => r.data.data),
  })

  // Backend returns List (not Page) — use data directly, not .content
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses().then((r) => r.data.data),
  })

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => inventoryApi.getCurrentStock({ page: 0, size: 100 }).then((r) => r.data.data),
    enabled: tab === 'stock',
  })

  const { data: lowStockAlerts } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryApi.getLowStockAlerts().then((r) => r.data.data),
  })

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => inventoryApi.getStockMovements({ page: 0, size: 200 }).then((r) => r.data.data),
    enabled: tab === 'reports',
  })

  const { data: purchaseOrders, isLoading: poLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => inventoryApi.getPurchaseOrders({ page: 0, size: 30 }).then((r) => r.data.data),
    enabled: tab === 'purchase-orders',
  })

  const { data: salesOrders, isLoading: soLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => inventoryApi.getSalesOrders({ page: 0, size: 30 }).then((r) => r.data.data),
    enabled: tab === 'sales-orders',
  })

  const { data: soContactsData } = useQuery({
    queryKey: ['so-contacts-picker', soContactSearch],
    queryFn: () => (
      soContactSearch.length >= 1
        ? crmApi.searchContacts(soContactSearch, { page: 0, size: 10 })
        : crmApi.getContacts({ page: 0, size: 20 })
    ).then((r) => r.data.data),
    enabled: showNewSO,
  })
  const soContacts: Contact[] = soContactsData?.content ?? []

  // products/stock/orders are paginated; warehouses and categories are flat lists
  const productList:   Product[]         = products?.content ?? []
  const warehouseList: Warehouse[]       = warehouses ?? []
  const catList:       ProductCategory[] = categories ?? []
  const stockList     = stockData?.content ?? []
  const poList        = purchaseOrders?.content ?? []
  const soList        = salesOrders?.content ?? []
  const lowStockCount = lowStockAlerts?.length ?? 0
  const allMovements  = movementsData?.content ?? []

  /* ── Category CRUD ── */
  const categoryForm     = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) })
  const editCategoryForm = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) })

  const createCategoryMutation = useMutation({
    mutationFn: inventoryApi.createCategory,
    onSuccess: () => {
      toast.success('Category created')
      qc.invalidateQueries({ queryKey: ['categories'] })
      setShowNewCategory(false)
      categoryForm.reset()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      inventoryApi.updateCategory(id, data),
    onSuccess: () => {
      toast.success('Category updated')
      qc.invalidateQueries({ queryKey: ['categories'] })
      setEditCategory(null)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: inventoryApi.deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted')
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function openEditCategory(c: ProductCategory) {
    setEditCategory(c)
    editCategoryForm.reset({ name: c.name, description: c.description ?? '' })
  }

  /* ── Product CRUD ── */
  const productForm     = useForm<ProductForm>({ resolver: zodResolver(productSchema), defaultValues: { taxRate: 7.5, reorderPoint: 5, trackInventory: true, unitOfMeasure: 'PCS' } })
  const editProductForm = useForm<ProductForm>({ resolver: zodResolver(productSchema) })

  const createProductMutation = useMutation({
    mutationFn: inventoryApi.createProduct,
    onSuccess: () => { toast.success('Product created'); qc.invalidateQueries({ queryKey: ['products'] }); setShowNewProduct(false); productForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) => inventoryApi.updateProduct(id, data),
    onSuccess: () => { toast.success('Product updated'); qc.invalidateQueries({ queryKey: ['products'] }); setEditProduct(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deleteProductMutation = useMutation({
    mutationFn: inventoryApi.deleteProduct,
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['products'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function openEditProduct(p: Product) {
    setEditProduct(p)
    editProductForm.reset({
      name: p.name, sku: p.sku ?? '', barcode: p.barcode ?? '', description: p.description ?? '',
      categoryId: p.categoryId ?? '', unitOfMeasure: p.unitOfMeasure, sellingPrice: p.sellingPrice,
      costPrice: p.costPrice, taxRate: p.taxRate ?? 7.5, reorderPoint: p.reorderPoint ?? 5,
      trackInventory: p.trackInventory ?? true,
    })
  }

  /* ── Warehouse CRUD ── */
  const warehouseForm     = useForm<WarehouseForm>({ resolver: zodResolver(warehouseSchema) })
  const editWarehouseForm = useForm<WarehouseForm>({ resolver: zodResolver(warehouseSchema) })

  const createWarehouseMutation = useMutation({
    mutationFn: inventoryApi.createWarehouse,
    onSuccess: () => {
      toast.success('Warehouse created')
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      setShowNewWarehouse(false)
      warehouseForm.reset()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WarehouseForm }) => inventoryApi.updateWarehouse(id, data),
    onSuccess: () => { toast.success('Warehouse updated'); qc.invalidateQueries({ queryKey: ['warehouses'] }); setEditWarehouse(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deactivateWarehouseMutation = useMutation({
    mutationFn: inventoryApi.deactivateWarehouse,
    onSuccess: () => { toast.success('Warehouse deactivated'); qc.invalidateQueries({ queryKey: ['warehouses'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function openEditWarehouse(w: Warehouse) {
    setEditWarehouse(w)
    editWarehouseForm.reset({ name: w.name, location: w.location ?? '', address: '' })
  }

  /* ── Stock adjustment ── */
  const adjustForm = useForm<AdjustForm>({ resolver: zodResolver(adjustSchema) })
  const adjustMutation = useMutation({
    mutationFn: inventoryApi.adjustStock,
    onSuccess: () => {
      toast.success('Stock adjusted')
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['low-stock'] })
      setShowAdjust(false)
      adjustForm.reset()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  /* ── Transfer ── */
  const transferForm = useForm<TransferForm>({ resolver: zodResolver(transferSchema) })
  const transferMutation = useMutation({
    mutationFn: inventoryApi.transferStock,
    onSuccess: () => {
      toast.success('Stock transferred successfully')
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      qc.invalidateQueries({ queryKey: ['low-stock'] })
      setShowTransfer(false)
      transferForm.reset()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  /* ── PO mutations ── */
  const poForm = useForm<POForm>({ resolver: zodResolver(poSchema), defaultValues: { currency: 'NGN', orderDate: today, lines: [{ productId: '', quantity: 1, unitPrice: 0, taxRate: 7.5, discountAmount: 0, taxIncluded: false }] } })
  const { fields: poLines, append: appendPOLine, remove: removePOLine } = useFieldArray({ control: poForm.control, name: 'lines' })

  const createPOMutation      = useMutation({ mutationFn: inventoryApi.createPurchaseOrder, onSuccess: () => { toast.success('Purchase order created'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); setShowNewPO(false); poForm.reset() }, onError: (e) => toast.error(getErrorMessage(e)) })
  const confirmPOMutation     = useMutation({ mutationFn: inventoryApi.confirmPurchaseOrder, onSuccess: () => { toast.success('PO confirmed — ready to receive goods'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })
  const receivePOMutation     = useMutation({ mutationFn: inventoryApi.receivePurchaseOrder, onSuccess: () => { toast.success('Goods received — stock updated'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['stock'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })
  const cancelPOMutation      = useMutation({ mutationFn: inventoryApi.cancelPurchaseOrder, onSuccess: () => { toast.success('PO cancelled'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })
  const createBillFromPoMutation = useMutation({
    mutationFn: (poId: string) => accountingApi.createBillFromPo(poId),
    onSuccess: () => {
      toast.success('Draft bill created in Accounting → Bills')
      qc.invalidateQueries({ queryKey: ['accounting-bills'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  /* ── SO mutations ── */
  const soForm = useForm<SOForm>({ resolver: zodResolver(soSchema), defaultValues: { currency: 'NGN', orderDate: today, lines: [{ productId: '', quantity: 1, unitPrice: 0, taxRate: 7.5, discountAmount: 0 }] } })
  const { fields: soLines, append: appendSOLine, remove: removeSOLine } = useFieldArray({ control: soForm.control, name: 'lines' })

  function pickSOContact(c: Contact) {
    setSoSelectedContact(c)
    soForm.setValue('customerName',  `${c.firstName} ${c.lastName ?? ''}`.trim())
    soForm.setValue('customerEmail', c.email ?? '')
    setShowSOContactPicker(false)
    setSoContactSearch('')
  }

  function clearSOContact() {
    setSoSelectedContact(null)
    soForm.setValue('customerName',  '')
    soForm.setValue('customerEmail', '')
  }

  const createSOMutation  = useMutation({ mutationFn: inventoryApi.createSalesOrder, onSuccess: () => { toast.success('Sales order created'); qc.invalidateQueries({ queryKey: ['sales-orders'] }); setShowNewSO(false); soForm.reset(); setSoSelectedContact(null); setSoContactSearch('') }, onError: (e) => toast.error(getErrorMessage(e)) })
  const confirmSOMutation = useMutation({ mutationFn: inventoryApi.confirmSalesOrder, onSuccess: () => { toast.success('SO confirmed — ready to invoice or fulfill'); qc.invalidateQueries({ queryKey: ['sales-orders'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })
  const fulfillSOMutation = useMutation({ mutationFn: inventoryApi.fulfillSalesOrder, onSuccess: () => { toast.success('Order fulfilled — stock deducted'); qc.invalidateQueries({ queryKey: ['sales-orders'] }); qc.invalidateQueries({ queryKey: ['stock'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })
  const cancelSOMutation  = useMutation({ mutationFn: inventoryApi.cancelSalesOrder, onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries({ queryKey: ['sales-orders'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })

  const poStatusBadge = (s: string) => s === 'RECEIVED' ? 'green' : s === 'SENT' ? 'blue' : s === 'CANCELLED' ? 'red' : 'gray'
  const soStatusBadge = (s: string) => s === 'FULFILLED' ? 'green' : s === 'CONFIRMED' ? 'blue' : s === 'CANCELLED' ? 'red' : 'gray'

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products',   value: products?.totalElements ?? 0, icon: Package,       color: 'text-green-600', bg: 'bg-green-50'  },
          { label: 'Categories',       value: catList.length,               icon: TagIcon,        color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Warehouses',       value: warehouseList.length,         icon: WarehouseIcon,  color: 'text-blue-500',  bg: 'bg-blue-50'   },
          { label: 'Low Stock Alerts', value: lowStockCount,                icon: AlertTriangle,  color: lowStockCount > 0 ? 'text-red-500' : 'text-green-600', bg: lowStockCount > 0 ? 'bg-red-50' : 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[12px] p-4 shadow-sm flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0', bg)}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
              <p className="text-[20px] font-extrabold text-gray-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Low stock alert banner ── */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-[13px] font-semibold text-red-700 flex-1">
            {lowStockCount} product{lowStockCount !== 1 ? 's are' : ' is'} below reorder level — restock soon to avoid stockouts.
          </p>
          <button onClick={() => setTab('stock')} className="text-[12px] font-bold text-red-600 hover:text-red-700">View Stock →</button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1 w-fit overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('inline-flex items-center gap-1.5 px-4 py-[7px] rounded-[6px] text-[13px] font-semibold transition-all whitespace-nowrap',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
          >
            <Icon size={13} /> {label}
            {key === 'stock' && lowStockCount > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{lowStockCount}</span>}
          </button>
        ))}
      </div>

      {/* ══ PRODUCTS TAB ══ */}
      {tab === 'products' && (
        <Card>
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 border-[1.5px] border-gray-200 rounded-[6px] px-3 py-2 w-72 focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,.1)] transition-all">
              <Search size={15} className="text-gray-400" />
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search by name or SKU…" className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder:text-gray-400" />
            </div>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewProduct(true)}>Add Product</Button>
          </div>
          <Table>
            <Thead><Th>Product</Th><Th>SKU</Th><Th>Category</Th><Th>Cost</Th><Th>Selling Price</Th><Th>VAT</Th><Th>Reorder Pt</Th><Th>Status</Th><Th></Th></Thead>
            <Tbody>
              {productsLoading ? <SkeletonRows cols={9} /> : productList.length === 0 ? (
                <EmptyState message="No products yet. Add your product catalog to start tracking inventory." icon={<Package size={28} />} />
              ) : productList.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div>
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      {p.description && <p className="text-[11.5px] text-gray-400 truncate max-w-[180px]">{p.description}</p>}
                    </div>
                  </Td>
                  <Td><span className="font-mono text-[12px] text-gray-600">{p.sku ?? '—'}</span></Td>
                  <Td>{p.categoryName ?? '—'}</Td>
                  <Td className="font-medium">{formatCurrency(p.costPrice)}</Td>
                  <Td className="font-bold text-green-700">{formatCurrency(p.sellingPrice)}</Td>
                  <Td>{p.taxRate ? `${p.taxRate}%` : '7.5%'}</Td>
                  <Td>{p.reorderPoint ?? '—'} {p.unitOfMeasure}</Td>
                  <Td><Badge variant={p.isActive !== false ? 'green' : 'gray'}>{p.isActive !== false ? 'Active' : 'Inactive'}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEditProduct(p)} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-green-50 hover:text-green-600 flex items-center justify-center text-gray-400 transition-colors"><Edit2 size={12} /></button>
                      <button onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteProductMutation.mutate(p.id) }} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ CATEGORIES TAB ══ */}
      {tab === 'categories' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Product Categories</h3>
              <p className="text-[12.5px] text-gray-500 mt-0.5">Organise products into categories for filtering and reporting</p>
            </div>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewCategory(true)}>Add Category</Button>
          </div>
          <Table>
            <Thead><Th>Name</Th><Th>Description</Th><Th>Products</Th><Th></Th></Thead>
            <Tbody>
              {categoriesLoading ? <SkeletonRows cols={4} /> : catList.length === 0 ? (
                <EmptyState
                  message="No categories yet. Create categories to organise your product catalogue."
                  icon={<FolderOpen size={28} />}
                />
              ) : catList.map((c) => {
                const productCount = productList.filter((p) => p.categoryId === c.id).length
                return (
                  <Tr key={c.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-[6px] bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <TagIcon size={12} className="text-purple-500" />
                        </div>
                        <span className="font-semibold text-gray-800">{c.name}</span>
                      </div>
                    </Td>
                    <Td className="text-gray-500 max-w-[280px] truncate">{c.description ?? '—'}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Package size={10} /> {productCount}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openEditCategory(c)} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-green-50 hover:text-green-600 flex items-center justify-center text-gray-400 transition-colors"><Edit2 size={12} /></button>
                        <button
                          onClick={() => { if (confirm(`Delete category "${c.name}"? Products in this category will be unassigned.`)) deleteCategoryMutation.mutate(c.id) }}
                          className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ STOCK LEVELS TAB ══ */}
      {tab === 'stock' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<ArrowUpDown size={14} />} onClick={() => setShowTransfer(true)}>Transfer Stock</Button>
            <Button icon={<ArrowUpDown size={14} />} onClick={() => setShowAdjust(true)}>Adjust Stock</Button>
          </div>
          <Card>
            <CardHeader title="Current Stock Levels" />
            <Table>
              <Thead><Th>Product</Th><Th>SKU</Th><Th>Warehouse</Th><Th>Quantity</Th><Th>Reorder Level</Th><Th>Status</Th></Thead>
              <Tbody>
                {stockLoading ? <SkeletonRows cols={6} /> : stockList.length === 0 ? (
                  <EmptyState message="No stock records. Receive a purchase order to add stock." icon={<BarChart3 size={28} />} />
                ) : stockList.map((s, i) => {
                  const qty = Number(s.quantityOnHand ?? 0)
                  const reorder = s.reorderPoint ?? 0
                  const isLow = reorder > 0 && qty <= reorder
                  return (
                    <Tr key={i} className={isLow ? 'bg-red-50/40' : ''}>
                      <Td className="font-semibold">{s.productName}</Td>
                      <Td><span className="font-mono text-[12px] text-gray-500">{s.productSku ?? '—'}</span></Td>
                      <Td>{s.warehouseName}</Td>
                      <Td><span className={cn('text-[15px] font-extrabold', isLow ? 'text-red-600' : 'text-gray-900')}>{qty.toFixed(2)}</span></Td>
                      <Td className="text-gray-500">{reorder > 0 ? reorder : '—'}</Td>
                      <Td>
                        {isLow
                          ? <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> Low Stock</span>
                          : <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> In Stock</span>
                        }
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ══ WAREHOUSES TAB ══ */}
      {tab === 'warehouses' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Warehouses & Locations</h3>
              <p className="text-[12.5px] text-gray-500 mt-0.5">{warehouseList.length} warehouse{warehouseList.length !== 1 ? 's' : ''} configured</p>
            </div>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewWarehouse(true)}>Add Warehouse</Button>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseList.length === 0 ? (
              <div className="col-span-3">
                <EmptyState message="No warehouses configured. Add a warehouse to start tracking stock by location." icon={<WarehouseIcon size={28} />} />
              </div>
            ) : warehouseList.map((w) => (
              <div key={w.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-green-200 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <WarehouseIcon size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-[14px] text-gray-900">{w.name}</p>
                      {w.location && <p className="text-[12px] text-gray-500 mt-0.5">{w.location}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditWarehouse(w)} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-green-50 hover:text-green-600 flex items-center justify-center text-gray-400 transition-colors"><Edit2 size={12} /></button>
                    <button
                      onClick={() => { if (confirm(`Deactivate "${w.name}"?`)) deactivateWarehouseMutation.mutate(w.id) }}
                      className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={w.isActive ? 'green' : 'gray'}>{w.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ══ PURCHASE ORDERS TAB ══ */}
      {tab === 'purchase-orders' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Purchase Orders</h3>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewPO(true)}>New Purchase Order</Button>
          </div>
          <Table>
            <Thead><Th>PO Number</Th><Th>Supplier</Th><Th>Amount</Th><Th>Expected</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></Thead>
            <Tbody>
              {poLoading ? <SkeletonRows cols={7} /> : poList.length === 0 ? (
                <EmptyState message="No purchase orders yet. Create one to restock inventory." icon={<TruckIcon size={28} />} />
              ) : poList.map((po) => (
                <Tr key={po.id}>
                  <Td><span className="font-mono font-semibold text-gray-700">{po.poNumber}</span></Td>
                  <Td className="font-semibold">{po.vendorName}</Td>
                  <Td className="font-bold">{formatCurrency(po.totalAmount)}</Td>
                  <Td className="text-gray-500">{po.expectedDate ? formatDate(po.expectedDate) : '—'}</Td>
                  <Td><Badge variant={poStatusBadge(po.status) as any}>{po.status}</Badge></Td>
                  <Td className="text-gray-400">{formatDate(po.createdAt)}</Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {po.status === 'DRAFT' && (
                        <button onClick={() => confirmPOMutation.mutate(po.id)} className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                          <CheckCircle2 size={10} /> Confirm
                        </button>
                      )}
                      {po.status === 'SENT' && (
                        <button onClick={() => receivePOMutation.mutate(po.id)} className="text-[11px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                          <CheckCircle2 size={10} /> Receive
                        </button>
                      )}
                      {(po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') && (
                        <button
                          onClick={() => createBillFromPoMutation.mutate(po.id)}
                          disabled={createBillFromPoMutation.isPending}
                          className="text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <FileText size={10} /> Create Bill
                        </button>
                      )}
                      {(po.status === 'DRAFT' || po.status === 'SENT') && (
                        <button onClick={() => { if (confirm('Cancel this PO?')) cancelPOMutation.mutate(po.id) }} className="text-[11px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                          <XCircle size={10} /> Cancel
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ SALES ORDERS TAB ══ */}
      {tab === 'sales-orders' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Sales Orders</h3>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewSO(true)}>New Sales Order</Button>
          </div>
          <Table>
            <Thead><Th>SO Number</Th><Th>Customer</Th><Th>Amount</Th><Th>Status</Th><Th>Invoice</Th><Th>Created</Th><Th>Actions</Th></Thead>
            <Tbody>
              {soLoading ? <SkeletonRows cols={7} /> : soList.length === 0 ? (
                <EmptyState message="No sales orders yet." icon={<ClipboardList size={28} />} />
              ) : soList.map((so) => (
                <Tr key={so.id}>
                  <Td><span className="font-mono font-semibold text-gray-700">{so.soNumber ?? so.orderNumber}</span></Td>
                  <Td className="font-semibold">{so.customerName}</Td>
                  <Td className="font-bold">{formatCurrency(so.totalAmount)}</Td>
                  <Td><Badge variant={soStatusBadge(so.status) as any}>{so.status.replace('_', ' ')}</Badge></Td>
                  <Td>
                    {so.linkedInvoiceId
                      ? <span className="text-[11px] font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Linked</span>
                      : <span className="text-[11px] text-gray-400">—</span>
                    }
                  </Td>
                  <Td className="text-gray-400">{formatDate(so.createdAt)}</Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {so.status === 'DRAFT' && (
                        <button onClick={() => confirmSOMutation.mutate(so.id)} className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                          <CheckCircle2 size={10} /> Confirm
                        </button>
                      )}
                      {so.status === 'CONFIRMED' && !so.linkedInvoiceId && (
                        <button
                          onClick={() => router.push(`/invoices?fromSo=${so.id}&soNumber=${encodeURIComponent(so.soNumber ?? '')}&customer=${encodeURIComponent(so.customerName)}`)}
                          className="text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                        >
                          <FileText size={10} /> Create Invoice
                        </button>
                      )}
                      {so.status === 'CONFIRMED' && (
                        <button onClick={() => fulfillSOMutation.mutate(so.id)} className="text-[11px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                          <CheckCircle2 size={10} /> Fulfill
                        </button>
                      )}
                      {(so.status === 'DRAFT' || so.status === 'CONFIRMED') && (
                        <button onClick={() => { if (confirm('Cancel this SO?')) cancelSOMutation.mutate(so.id) }} className="text-[11px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                          <XCircle size={10} /> Cancel
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ REPORTS TAB ══ */}
      {tab === 'reports' && (() => {
        const filtered = allMovements.filter((m) => {
          const typeMatch = !reportTypeFilter || m.movementType === reportTypeFilter
          const productMatch = !reportProductFilter || m.productId === reportProductFilter
          return typeMatch && productMatch
        })
        const totalIn   = allMovements.filter((m) => ['STOCK_IN', 'TRANSFER_IN'].includes(m.movementType ?? '')).reduce((s, m) => s + Number(m.quantity ?? 0), 0)
        const totalOut  = allMovements.filter((m) => ['STOCK_OUT', 'TRANSFER_OUT', 'WRITE_OFF'].includes(m.movementType ?? '')).reduce((s, m) => s + Number(m.quantity ?? 0), 0)
        const totalAdj  = allMovements.filter((m) => m.movementType === 'ADJUSTMENT').reduce((s, m) => s + Number(m.quantity ?? 0), 0)
        const movTypeBadge = (t: string) => {
          if (['STOCK_IN', 'TRANSFER_IN'].includes(t)) return 'green'
          if (['STOCK_OUT', 'TRANSFER_OUT', 'WRITE_OFF'].includes(t)) return 'red'
          return 'amber'
        }
        return (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Stock In',  value: totalIn.toFixed(2),  cls: 'text-green-700' },
                { label: 'Total Stock Out', value: totalOut.toFixed(2), cls: 'text-red-600'   },
                { label: 'Adjustments',     value: totalAdj.toFixed(2), cls: 'text-amber-700' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-[10px] p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                  <p className={`text-[22px] font-extrabold mt-1 ${cls}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                label=""
                value={reportTypeFilter}
                onChange={(e) => setReportTypeFilter(e.target.value)}
                className="w-52"
              >
                <option value="">All Movement Types</option>
                <option value="STOCK_IN">Stock In</option>
                <option value="STOCK_OUT">Stock Out (Invoice)</option>
                <option value="TRANSFER_IN">Transfer In</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="WRITE_OFF">Write Off</option>
              </Select>
              <Select
                label=""
                value={reportProductFilter}
                onChange={(e) => setReportProductFilter(e.target.value)}
                className="w-56"
              >
                <option value="">All Products</option>
                {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              {(reportTypeFilter || reportProductFilter) && (
                <button onClick={() => { setReportTypeFilter(''); setReportProductFilter('') }} className="text-[12px] text-gray-400 hover:text-red-500 transition-colors">
                  Clear filters
                </button>
              )}
              <span className="ml-auto text-[12px] text-gray-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            <Card>
              <Table>
                <Thead><Th>Date</Th><Th>Product</Th><Th>Warehouse</Th><Th>Type</Th><Th>Qty</Th><Th>Reference</Th><Th>Reason</Th></Thead>
                <Tbody>
                  {movementsLoading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? (
                    <EmptyState message="No stock movements found." icon={<BarChart3 size={28} />} />
                  ) : filtered.map((m) => (
                    <Tr key={m.id}>
                      <Td className="text-gray-400 text-[12px]">{formatDate(m.createdAt)}</Td>
                      <Td className="font-semibold">{m.productName ?? '—'}</Td>
                      <Td className="text-gray-500">{m.warehouseName ?? '—'}</Td>
                      <Td>
                        <Badge variant={movTypeBadge(m.movementType ?? '') as any}>
                          {(m.movementType ?? '').replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td className={cn('font-bold', ['STOCK_IN','TRANSFER_IN'].includes(m.movementType ?? '') ? 'text-green-700' : ['STOCK_OUT','TRANSFER_OUT','WRITE_OFF'].includes(m.movementType ?? '') ? 'text-red-600' : 'text-amber-700')}>
                        {['STOCK_OUT','TRANSFER_OUT','WRITE_OFF'].includes(m.movementType ?? '') ? '-' : '+'}{Number(m.quantity ?? 0).toFixed(2)}
                      </Td>
                      <Td><span className="font-mono text-[11px] text-gray-400">{m.reference ?? '—'}</span></Td>
                      <Td className="text-gray-500 max-w-[160px] truncate">{m.reason ?? '—'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          </div>
        )
      })()}

      {/* ══ MODALS ══ */}

      {/* New Category */}
      <Modal open={showNewCategory} onClose={() => { setShowNewCategory(false); categoryForm.reset() }} title="Add Category" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowNewCategory(false)}>Cancel</Button><Button loading={createCategoryMutation.isPending} onClick={categoryForm.handleSubmit((v) => createCategoryMutation.mutate(v))}>Save Category</Button></>}>
        <div className="space-y-4">
          <Input label="Category Name" required {...categoryForm.register('name')} error={categoryForm.formState.errors.name?.message} placeholder="e.g. Electronics, Office Supplies" hint="A clear name that groups related products" />
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea {...categoryForm.register('description')} rows={3} placeholder="Brief description of products in this category…" className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none" />
          </div>
        </div>
      </Modal>

      {/* Edit Category */}
      <Modal open={!!editCategory} onClose={() => setEditCategory(null)} title={`Edit — ${editCategory?.name}`} size="sm"
        footer={<><Button variant="outline" onClick={() => setEditCategory(null)}>Cancel</Button><Button loading={updateCategoryMutation.isPending} onClick={editCategoryForm.handleSubmit((v) => updateCategoryMutation.mutate({ id: editCategory!.id, data: v }))}>Save Changes</Button></>}>
        <div className="space-y-4">
          <Input label="Category Name" required {...editCategoryForm.register('name')} error={editCategoryForm.formState.errors.name?.message} />
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Description</label>
            <textarea {...editCategoryForm.register('description')} rows={3} className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none" />
          </div>
        </div>
      </Modal>

      {/* New Product */}
      <Modal open={showNewProduct} onClose={() => { setShowNewProduct(false); productForm.reset() }} title="Add Product" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowNewProduct(false)}>Cancel</Button><Button loading={createProductMutation.isPending} onClick={productForm.handleSubmit((v) => createProductMutation.mutate(v))}>Save Product</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Product Name" required {...productForm.register('name')} error={productForm.formState.errors.name?.message} className="col-span-2" hint="Full name of the product as it will appear in orders and invoices" />
          <Input label="SKU" {...productForm.register('sku')} placeholder="SKU-001" hint="Auto-generated if left blank" />
          <Input label="Barcode" {...productForm.register('barcode')} placeholder="1234567890" hint="EAN, UPC, or custom barcode" />
          <Select label="Category" {...productForm.register('categoryId')} hint="Assign a category for easier filtering">
            <option value="">— No category —</option>
            {catList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Unit of Measure" required {...productForm.register('unitOfMeasure')} error={productForm.formState.errors.unitOfMeasure?.message} hint="How this product is measured and sold">
            <option value="PCS">Pieces (PCS)</option>
            <option value="KG">Kilograms (KG)</option>
            <option value="LTR">Litres (LTR)</option>
            <option value="MTR">Metres (MTR)</option>
            <option value="BOX">Box</option>
            <option value="CARTON">Carton</option>
            <option value="PACK">Pack</option>
            <option value="DOZEN">Dozen</option>
            <option value="PAIR">Pair</option>
          </Select>
          <Input label="Cost Price (₦)" required type="number" step="0.01" {...productForm.register('costPrice')} error={productForm.formState.errors.costPrice?.message} hint="Purchase/production cost per unit" />
          <Input label="Selling Price (₦)" required type="number" step="0.01" {...productForm.register('sellingPrice')} error={productForm.formState.errors.sellingPrice?.message} hint="Price charged to customers" />
          <Select
            label="VAT Type"
            hint="VAT rate applied when selling this product"
            value={productForm.watch('taxRate')?.toString() ?? '7.5'}
            onChange={(e) => productForm.setValue('taxRate', parseFloat(e.target.value))}
          >
            <option value="7.5">STANDARD_VAT — Standard VAT (7.5%)</option>
            <option value="0">ZERO_VAT — Zero-rated VAT (0%)</option>
            <option value="-1">EXEMPT — VAT Exempt</option>
          </Select>
          <Input label="Reorder Point" type="number" {...productForm.register('reorderPoint')} hint="Low-stock alert triggers when stock reaches this level" />
          <Input label="Expiry Date" type="date" {...productForm.register('expiryDate')} hint="Leave blank for non-perishable items. Used to track batch expiry in FIFO costing." />
          <div className="col-span-2 border-t border-gray-200 pt-4 mt-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">Opening Stock (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Initial Quantity" type="number" min="0" step="0.01" {...productForm.register('initialStock')} hint="How many units you have right now" />
              <Select label="Store In Warehouse" {...productForm.register('initialStockWarehouseId')} hint="Which warehouse holds this stock">
                <option value="">— No initial stock —</option>
                {warehouseList.map((w) => <option key={w.id} value={w.id}>{w.name}{w.location ? ` (${w.location})` : ''}</option>)}
              </Select>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea {...productForm.register('description')} rows={2} placeholder="Product description…" className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none" />
          </div>
        </div>
      </Modal>

      {/* Edit Product */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title={`Edit — ${editProduct?.name}`} size="lg"
        footer={<><Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button><Button loading={updateProductMutation.isPending} onClick={editProductForm.handleSubmit((v) => updateProductMutation.mutate({ id: editProduct!.id, data: v }))}>Save Changes</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Product Name" required {...editProductForm.register('name')} error={editProductForm.formState.errors.name?.message} className="col-span-2" />
          <Input label="SKU" {...editProductForm.register('sku')} />
          <Input label="Barcode" {...editProductForm.register('barcode')} />
          <Select label="Category" {...editProductForm.register('categoryId')}>
            <option value="">— No category —</option>
            {catList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Unit of Measure" {...editProductForm.register('unitOfMeasure')}>
            <option value="PCS">Pieces (PCS)</option>
            <option value="KG">Kilograms (KG)</option>
            <option value="LTR">Litres (LTR)</option>
            <option value="MTR">Metres (MTR)</option>
            <option value="BOX">Box</option>
            <option value="CARTON">Carton</option>
            <option value="PACK">Pack</option>
            <option value="DOZEN">Dozen</option>
            <option value="PAIR">Pair</option>
          </Select>
          <Input label="Cost Price (₦)" type="number" step="0.01" {...editProductForm.register('costPrice')} />
          <Input label="Selling Price (₦)" type="number" step="0.01" {...editProductForm.register('sellingPrice')} />
          <Select
            label="VAT Type"
            value={editProductForm.watch('taxRate')?.toString() ?? '7.5'}
            onChange={(e) => editProductForm.setValue('taxRate', parseFloat(e.target.value))}
          >
            <option value="7.5">STANDARD_VAT — Standard VAT (7.5%)</option>
            <option value="0">ZERO_VAT — Zero-rated VAT (0%)</option>
            <option value="-1">EXEMPT — VAT Exempt</option>
          </Select>
          <Input label="Reorder Point" type="number" {...editProductForm.register('reorderPoint')} />
          <Input label="Expiry Date" type="date" {...editProductForm.register('expiryDate')} hint="Leave blank for non-perishable items" />
        </div>
      </Modal>

      {/* New Warehouse */}
      <Modal open={showNewWarehouse} onClose={() => { setShowNewWarehouse(false); warehouseForm.reset() }} title="Add Warehouse" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowNewWarehouse(false)}>Cancel</Button><Button loading={createWarehouseMutation.isPending} onClick={warehouseForm.handleSubmit((v) => createWarehouseMutation.mutate(v))}>Save Warehouse</Button></>}>
        <div className="space-y-4">
          <Input label="Warehouse Name" required {...warehouseForm.register('name')} error={warehouseForm.formState.errors.name?.message} placeholder="Main Warehouse" hint="Name to identify this warehouse" />
          <Input label="Location" {...warehouseForm.register('location')} placeholder="Lagos Island" hint="City or area where the warehouse is located" />
          <Input label="Full Address" {...warehouseForm.register('address')} placeholder="15 Industrial Layout, Ikeja, Lagos" hint="Street address for delivery instructions" />
        </div>
      </Modal>

      {/* Edit Warehouse */}
      <Modal open={!!editWarehouse} onClose={() => setEditWarehouse(null)} title={`Edit — ${editWarehouse?.name}`} size="sm"
        footer={<><Button variant="outline" onClick={() => setEditWarehouse(null)}>Cancel</Button><Button loading={updateWarehouseMutation.isPending} onClick={editWarehouseForm.handleSubmit((v) => updateWarehouseMutation.mutate({ id: editWarehouse!.id, data: v }))}>Save Changes</Button></>}>
        <div className="space-y-4">
          <Input label="Warehouse Name" required {...editWarehouseForm.register('name')} error={editWarehouseForm.formState.errors.name?.message} />
          <Input label="Location" {...editWarehouseForm.register('location')} />
          <Input label="Full Address" {...editWarehouseForm.register('address')} />
        </div>
      </Modal>

      {/* Stock Adjustment */}
      <Modal open={showAdjust} onClose={() => { setShowAdjust(false); adjustForm.reset() }} title="Adjust Stock" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowAdjust(false)}>Cancel</Button><Button loading={adjustMutation.isPending} onClick={adjustForm.handleSubmit((v) => adjustMutation.mutate(v))}>Apply Adjustment</Button></>}>
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-3 text-[12.5px] text-amber-700">
            This sets the <strong>absolute</strong> stock quantity. Use for stocktake corrections — all adjustments are logged for audit.
          </div>
          <Select label="Product" required {...adjustForm.register('productId')} error={adjustForm.formState.errors.productId?.message}>
            <option value="">Select product…</option>
            {productList.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
          </Select>
          <Select label="Warehouse" required {...adjustForm.register('warehouseId')} error={adjustForm.formState.errors.warehouseId?.message}>
            <option value="">Select warehouse…</option>
            {warehouseList.map((w) => <option key={w.id} value={w.id}>{w.name}{w.location ? ` — ${w.location}` : ''}</option>)}
          </Select>
          <Input label="New Quantity" required type="number" min="0" {...adjustForm.register('newQuantity')} error={adjustForm.formState.errors.newQuantity?.message} hint="The correct absolute count (not a delta)" />
          <Select label="Reason" required {...adjustForm.register('reason')} error={adjustForm.formState.errors.reason?.message}>
            <option value="">Select reason…</option>
            <option value="STOCKTAKE">Stocktake / Physical count</option>
            <option value="DAMAGED">Damaged goods write-off</option>
            <option value="RETURNED">Customer return</option>
            <option value="CORRECTION">Data entry correction</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </Modal>

      {/* Transfer Stock */}
      <Modal open={showTransfer} onClose={() => { setShowTransfer(false); transferForm.reset() }} title="Transfer Stock Between Warehouses" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button><Button loading={transferMutation.isPending} onClick={transferForm.handleSubmit((v) => transferMutation.mutate(v))}>Transfer</Button></>}>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3 text-[12.5px] text-blue-700">
            Moves stock from one warehouse to another. Both warehouses must hold the same product. Source stock is reduced and destination stock is increased by the same quantity.
          </div>
          <Select label="Product" required {...transferForm.register('productId')} error={transferForm.formState.errors.productId?.message}>
            <option value="">Select product…</option>
            {productList.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
          </Select>
          <Select label="From Warehouse (Source)" required {...transferForm.register('fromWarehouseId')} error={transferForm.formState.errors.fromWarehouseId?.message}>
            <option value="">Select source warehouse…</option>
            {warehouseList.map((w) => <option key={w.id} value={w.id}>{w.name}{w.location ? ` — ${w.location}` : ''}</option>)}
          </Select>
          <Select label="To Warehouse (Destination)" required {...transferForm.register('toWarehouseId')} error={transferForm.formState.errors.toWarehouseId?.message}>
            <option value="">Select destination warehouse…</option>
            {warehouseList.map((w) => <option key={w.id} value={w.id}>{w.name}{w.location ? ` — ${w.location}` : ''}</option>)}
          </Select>
          <Input label="Quantity" required type="number" min="0.01" step="0.01" {...transferForm.register('quantity')} error={transferForm.formState.errors.quantity?.message} hint="Units to move from source to destination" />
          <Input label="Reason" {...transferForm.register('reason')} placeholder="e.g. Replenishment for low stock" hint="Optional — logged in movement history" />
        </div>
      </Modal>

      {/* New Purchase Order */}
      <Modal open={showNewPO} onClose={() => { setShowNewPO(false); poForm.reset() }} title="New Purchase Order" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowNewPO(false)}>Cancel</Button><Button loading={createPOMutation.isPending} onClick={poForm.handleSubmit((v) => createPOMutation.mutate(v))}>Create PO</Button></>}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Supplier / Vendor Name" required {...poForm.register('vendorName')} error={poForm.formState.errors.vendorName?.message} className="col-span-2" hint="Name of the supplier you are purchasing from" />
            <Input label="Vendor Email" type="email" {...poForm.register('vendorEmail')} error={poForm.formState.errors.vendorEmail?.message} hint="Vendor email for sending PO confirmation" />
            <Select label="Destination Warehouse" required {...poForm.register('warehouseId')} error={poForm.formState.errors.warehouseId?.message} hint="Where goods will be received and stored">
              <option value="">— Select warehouse —</option>
              {warehouseList.map((w) => <option key={w.id} value={w.id}>{w.name}{w.location ? ` (${w.location})` : ''}</option>)}
            </Select>
            <Input label="Order Date" required type="date" {...poForm.register('orderDate')} hint="Date of this purchase order" />
            <Input label="Expected Delivery" type="date" {...poForm.register('expectedDate')} hint="When you expect the goods to arrive" />
          </div>

          {warehouseList.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2.5 text-[12.5px] text-amber-700 flex items-center gap-2">
              <AlertTriangle size={13} className="flex-shrink-0" />
              No warehouses configured. <button type="button" onClick={() => { setShowNewPO(false); setShowNewWarehouse(true) }} className="underline font-semibold">Add a warehouse first.</button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold uppercase tracking-wide text-gray-500">Line Items</p>
              <button type="button" onClick={() => appendPOLine({ productId: '', quantity: 1, unitPrice: 0, taxRate: 7.5, discountAmount: 0, taxIncluded: false })} className="text-[12px] font-semibold text-green-600 hover:text-green-700 flex items-center gap-1"><Plus size={12} /> Add line</button>
            </div>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_70px_110px_150px_24px] gap-2 px-3 mb-1">
              {['Product', 'Qty', 'Unit Price', 'Tax on this price?', ''].map((h) => (
                <p key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{h}</p>
              ))}
            </div>
            <div className="space-y-2">
              {poLines.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[1fr_70px_110px_150px_24px] gap-2 items-center p-3 bg-gray-50 rounded-[8px] border border-gray-200">
                  <Select {...poForm.register(`lines.${i}.productId`)}>
                    <option value="">Select product…</option>
                    {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                  <Input type="number" step="0.01" {...poForm.register(`lines.${i}.quantity`)} />
                  <Input type="number" step="0.01" {...poForm.register(`lines.${i}.unitPrice`)} />
                  <Select {...poForm.register(`lines.${i}.taxIncluded`, { setValueAs: (v) => v === 'true' })}>
                    <option value="false">+ Add 7.5% VAT</option>
                    <option value="true">VAT already included</option>
                  </Select>
                  {poLines.length > 1
                    ? <button type="button" onClick={() => removePOLine(i)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                    : <div />
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* New Sales Order */}
      <Modal open={showNewSO} onClose={() => { setShowNewSO(false); soForm.reset(); setSoSelectedContact(null); setSoContactSearch('') }} title="New Sales Order" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowNewSO(false)}>Cancel</Button><Button loading={createSOMutation.isPending} onClick={soForm.handleSubmit((v) => createSOMutation.mutate(v))}>Create Sales Order</Button></>}>
        <div className="space-y-5">

          {/* ── Contact picker ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-bold text-gray-700 flex items-center gap-1.5">
                <UserCheck size={14} className="text-green-600" />
                Select from Contacts
                <span className="text-[11px] font-normal text-gray-400 ml-1">— auto-fills customer details</span>
              </p>
              {soSelectedContact && (
                <button type="button" onClick={clearSOContact} className="text-[12px] text-gray-400 hover:text-red-500 transition-colors">Clear</button>
              )}
            </div>

            {soSelectedContact ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-[8px] px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">
                  {soSelectedContact.firstName[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-gray-900">{soSelectedContact.firstName} {soSelectedContact.lastName}</p>
                  <p className="text-[11px] text-gray-500 flex gap-3 flex-wrap mt-0.5">
                    {soSelectedContact.email && <span>{soSelectedContact.email}</span>}
                  </p>
                </div>
                <span className="ml-auto text-[11px] bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Selected</span>
              </div>
            ) : (
              <>
                <div
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-[6px] px-3 py-2 cursor-text focus-within:border-green-400 transition-colors"
                  onClick={() => setShowSOContactPicker(true)}
                >
                  <Search size={13} className="text-gray-400 flex-shrink-0" />
                  <input
                    value={soContactSearch}
                    onChange={(e) => { setSoContactSearch(e.target.value); setShowSOContactPicker(true) }}
                    onFocus={() => setShowSOContactPicker(true)}
                    placeholder="Search contacts by name or email…"
                    className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
                {showSOContactPicker && (
                  <div className="mt-1 bg-white border border-gray-200 rounded-[8px] shadow-md overflow-hidden">
                    {soContacts.length === 0 ? (
                      <p className="text-[13px] text-gray-400 text-center py-4">
                        {soContactSearch ? 'No contacts found' : 'No contacts yet — add some in the CRM module'}
                      </p>
                    ) : soContacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickSOContact(c)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
                          {c.firstName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                          <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                        </div>
                        {c.phone && <p className="text-[11px] text-gray-400 flex-shrink-0">{c.phone}</p>}
                      </button>
                    ))}
                    <button type="button" onClick={() => setShowSOContactPicker(false)} className="w-full text-center text-[12px] text-gray-400 py-2 border-t border-gray-100 hover:bg-gray-50">
                      Close
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer Name" required {...soForm.register('customerName')} error={soForm.formState.errors.customerName?.message} className="col-span-2" hint="Edit or type a name if not selecting from contacts" />
            <Input label="Customer Email" type="email" {...soForm.register('customerEmail')} hint="For order confirmation" />
            <Select label="Ship From Warehouse" required {...soForm.register('warehouseId')} error={soForm.formState.errors.warehouseId?.message} hint="Warehouse to fulfill stock from">
              <option value="">— Select warehouse —</option>
              {warehouseList.map((w) => <option key={w.id} value={w.id}>{w.name}{w.location ? ` (${w.location})` : ''}</option>)}
            </Select>
            <Input label="Order Date" required type="date" {...soForm.register('orderDate')} hint="Date of this sales order" />
            <Input label="Expected Delivery" type="date" {...soForm.register('expectedDate')} hint="Estimated delivery date to customer" />
          </div>

          {warehouseList.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2.5 text-[12.5px] text-amber-700 flex items-center gap-2">
              <AlertTriangle size={13} className="flex-shrink-0" />
              No warehouses configured. <button type="button" onClick={() => { setShowNewSO(false); setShowNewWarehouse(true) }} className="underline font-semibold">Add a warehouse first.</button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold uppercase tracking-wide text-gray-500">Line Items</p>
              <button type="button" onClick={() => appendSOLine({ productId: '', quantity: 1, unitPrice: 0, taxRate: 7.5, discountAmount: 0 })} className="text-[12px] font-semibold text-green-600 hover:text-green-700 flex items-center gap-1"><Plus size={12} /> Add line</button>
            </div>
            <div className="space-y-2">
              {soLines.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[1fr_80px_110px_24px] gap-2 items-end p-3 bg-gray-50 rounded-[8px] border border-gray-200">
                  <Select
                    label={i === 0 ? 'Product' : undefined}
                    {...soForm.register(`lines.${i}.productId`)}
                    onChange={(e) => {
                      soForm.setValue(`lines.${i}.productId`, e.target.value, { shouldValidate: true })
                      const prod = productList.find((p) => p.id === e.target.value)
                      if (prod) {
                        soForm.setValue(`lines.${i}.unitPrice`, prod.sellingPrice)
                        soForm.setValue(`lines.${i}.taxRate`, prod.taxRate ?? 7.5)
                      }
                    }}
                  >
                    <option value="">Select product…</option>
                    {productList.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.sellingPrice)}</option>)}
                  </Select>
                  <Input label={i === 0 ? 'Qty' : undefined} type="number" step="0.01" {...soForm.register(`lines.${i}.quantity`)} />
                  <Input label={i === 0 ? 'Unit Price' : undefined} type="number" step="0.01" {...soForm.register(`lines.${i}.unitPrice`)} />
                  {soLines.length > 1
                    ? <button type="button" onClick={() => removeSOLine(i)} className={cn('w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500', i === 0 ? 'mt-[22px]' : '')}><Trash2 size={12} /></button>
                    : <div />
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  )
}