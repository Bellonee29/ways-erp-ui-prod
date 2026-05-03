'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, TrendingUp, Package, ShoppingCart,
  BarChart2, CheckCircle2, Clock, XCircle,
  ArrowUpCircle, ArrowDownCircle, AlertTriangle,
  Building2, Layers, RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { invoicesApi } from '@/lib/api/invoices'
import { inventoryApi } from '@/lib/api/inventory'
import { divisionsApi } from '@/lib/api/divisions'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonRows } from '@/components/ui/Table'
import Badge, { invoiceStatusBadge } from '@/components/ui/Badge'
import type { Invoice, SalesOrder, PurchaseOrder } from '@/types'

type Tab = 'overview' | 'invoices' | 'inventory' | 'orders'
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview',   label: 'Overview',         icon: BarChart2    },
  { key: 'invoices',   label: 'Invoices',          icon: FileText     },
  { key: 'inventory',  label: 'Inventory',         icon: Package      },
  { key: 'orders',     label: 'Orders',            icon: ShoppingCart },
]

function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-[12px] p-4 shadow-sm flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400 leading-tight">{label}</p>
        <p className="text-[20px] font-extrabold text-gray-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-gray-600 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={cn('h-2 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] font-semibold text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

export default function ReportsPage() {
  const { user, isTenantAdmin } = useAuthStore()
  const isAdmin = isTenantAdmin()
  const [tab, setTab] = useState<Tab>('overview')

  /* ── Invoices ── */
  const { data: invoicesData, isLoading: invLoading } = useQuery({
    queryKey: ['reports-invoices', isAdmin],
    queryFn: () =>
      (isAdmin ? invoicesApi.getAllInvoices : invoicesApi.getMyInvoices)({ page: 0, size: 500 })
        .then((r) => r.data.data),
  })
  const invoices: Invoice[] = invoicesData?.content ?? []

  /* ── Stock movements ── */
  const { data: movementsData, isLoading: movLoading } = useQuery({
    queryKey: ['reports-movements'],
    queryFn: () => inventoryApi.getStockMovements({ page: 0, size: 500 }).then((r) => r.data.data),
  })
  const movements = movementsData?.content ?? []

  /* ── Products ── */
  const { data: productsData } = useQuery({
    queryKey: ['reports-products'],
    queryFn: () => inventoryApi.getProducts({ page: 0, size: 500 }).then((r) => r.data.data),
  })
  const products = productsData?.content ?? []

  /* ── Low stock ── */
  const { data: lowStock } = useQuery({
    queryKey: ['reports-low-stock'],
    queryFn: () => inventoryApi.getLowStockAlerts().then((r) => r.data.data),
  })

  /* ── Sales Orders ── */
  const { data: soData, isLoading: soLoading } = useQuery({
    queryKey: ['reports-so'],
    queryFn: () => inventoryApi.getSalesOrders({ page: 0, size: 500 }).then((r) => r.data.data),
  })
  const salesOrders: SalesOrder[] = soData?.content ?? []

  /* ── Purchase Orders ── */
  const { data: poData, isLoading: poLoading } = useQuery({
    queryKey: ['reports-po'],
    queryFn: () => inventoryApi.getPurchaseOrders({ page: 0, size: 500 }).then((r) => r.data.data),
  })
  const purchaseOrders: PurchaseOrder[] = poData?.content ?? []

  /* ── Divisions (Tenant Admin only) ── */
  const { data: divisions } = useQuery({
    queryKey: ['reports-divisions'],
    queryFn: () => divisionsApi.getDivisions().then((r) => r.data.data),
    enabled: isAdmin,
  })

  /* ── Invoice metrics ── */
  const totalRevenue     = invoices.filter((i) => i.status === 'FISCALIZED').reduce((s, i) => s + i.totalAmount, 0)
  const totalPaid        = invoices.filter((i) => i.invoicePaymentStatus === 'PAID').reduce((s, i) => s + i.totalAmount, 0)
  const totalPending     = invoices.filter((i) => i.invoicePaymentStatus === 'PENDING').reduce((s, i) => s + i.totalAmount, 0)
  const fiscalizedCount  = invoices.filter((i) => i.status === 'FISCALIZED').length
  const draftCount       = invoices.filter((i) => i.status === 'DRAFT').length
  const failedCount      = invoices.filter((i) => i.status === 'FAILED').length
  const recentInvoices   = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)

  /* ── Stock metrics ── */
  const stockIn    = movements.filter((m) => ['STOCK_IN', 'TRANSFER_IN'].includes(m.movementType ?? '')).reduce((s, m) => s + Number(m.quantity ?? 0), 0)
  const stockOut   = movements.filter((m) => ['STOCK_OUT', 'TRANSFER_OUT', 'WRITE_OFF'].includes(m.movementType ?? '')).reduce((s, m) => s + Number(m.quantity ?? 0), 0)
  const adjustments = movements.filter((m) => m.movementType === 'ADJUSTMENT').length
  const recentMov  = [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)

  /* ── Order metrics ── */
  const soDraft      = salesOrders.filter((s) => s.status === 'DRAFT').length
  const soConfirmed  = salesOrders.filter((s) => s.status === 'CONFIRMED').length
  const soFulfilled  = salesOrders.filter((s) => s.status === 'FULFILLED').length
  const soCancelled  = salesOrders.filter((s) => s.status === 'CANCELLED').length
  const soRevenue    = salesOrders.filter((s) => s.status === 'FULFILLED').reduce((s, o) => s + o.totalAmount, 0)

  const poDraft     = purchaseOrders.filter((p) => p.status === 'DRAFT').length
  const poSent      = purchaseOrders.filter((p) => p.status === 'SENT').length
  const poReceived  = purchaseOrders.filter((p) => p.status === 'RECEIVED').length
  const poValue     = purchaseOrders.filter((p) => p.status === 'RECEIVED').reduce((s, p) => s + p.totalAmount, 0)

  const movTypeBadge = (t: string) => {
    if (['STOCK_IN', 'TRANSFER_IN'].includes(t)) return 'green'
    if (['STOCK_OUT', 'TRANSFER_OUT', 'WRITE_OFF'].includes(t)) return 'red'
    return 'amber'
  }

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-gray-900">Reports</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {isAdmin
              ? 'System-wide activity across all divisions'
              : `Activity report for ${user?.organizationName ?? 'your division'}`}
          </p>
        </div>
        {isAdmin && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            <Building2 size={12} /> Tenant Admin — All Divisions
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('inline-flex items-center gap-1.5 px-4 py-[7px] rounded-[6px] text-[13px] font-semibold transition-all whitespace-nowrap',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {tab === 'overview' && (
        <div className="space-y-5">

          {/* Top KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue"      value={formatCurrency(totalRevenue)}  sub="Fiscalized invoices"       icon={TrendingUp}   color="text-green-600"  bg="bg-green-50"  />
            <KpiCard label="Total Invoices"     value={invoices.length}               sub={`${fiscalizedCount} fiscalized`}  icon={FileText}     color="text-blue-600"   bg="bg-blue-50"   />
            <KpiCard label="Sales Orders"       value={salesOrders.length}            sub={`${soFulfilled} fulfilled`} icon={ShoppingCart} color="text-purple-600" bg="bg-purple-50" />
            <KpiCard label="Low Stock Alerts"   value={lowStock?.length ?? 0}         sub="Below reorder point"        icon={AlertTriangle} color={lowStock?.length ? 'text-red-500' : 'text-green-600'} bg={lowStock?.length ? 'bg-red-50' : 'bg-green-50'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Invoice status breakdown */}
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">Invoice Status Breakdown</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Fiscalized', value: fiscalizedCount,        color: 'bg-green-500'  },
                  { label: 'Draft',      value: draftCount,             color: 'bg-gray-400'   },
                  { label: 'Failed',     value: failedCount,            color: 'bg-red-400'    },
                  { label: 'Cancelled',  value: invoices.filter((i) => i.status === 'CANCELLED').length, color: 'bg-orange-400' },
                ].map((row) => (
                  <MiniBar key={row.label} label={row.label} value={row.value} max={invoices.length} color={row.color} />
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between text-[12px] text-gray-500">
                  <span>Total: <strong className="text-gray-800">{invoices.length}</strong></span>
                  <span>Paid: <strong className="text-green-700">{formatCurrency(totalPaid)}</strong></span>
                  <span>Pending: <strong className="text-amber-700">{formatCurrency(totalPending)}</strong></span>
                </div>
              </div>
            </Card>

            {/* Stock activity */}
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">Stock Activity</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Stock In',     value: Math.round(stockIn),  color: 'bg-green-500' },
                  { label: 'Stock Out',    value: Math.round(stockOut), color: 'bg-red-400'   },
                  { label: 'Adjustments', value: adjustments,           color: 'bg-amber-400' },
                ].map((row) => (
                  <MiniBar key={row.label} label={row.label} value={row.value} max={Math.max(stockIn, stockOut, adjustments, 1)} color={row.color} />
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between text-[12px] text-gray-500">
                  <span>Products: <strong className="text-gray-800">{products.length}</strong></span>
                  <span>Low stock: <strong className="text-red-600">{lowStock?.length ?? 0}</strong></span>
                  <span>Movements: <strong className="text-gray-800">{movements.length}</strong></span>
                </div>
              </div>
            </Card>

            {/* Sales vs Purchase orders */}
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">Sales Orders</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Draft',     value: soDraft,     color: 'bg-gray-400'   },
                  { label: 'Confirmed', value: soConfirmed, color: 'bg-blue-400'   },
                  { label: 'Fulfilled', value: soFulfilled, color: 'bg-green-500'  },
                  { label: 'Cancelled', value: soCancelled, color: 'bg-red-400'    },
                ].map((row) => (
                  <MiniBar key={row.label} label={row.label} value={row.value} max={salesOrders.length || 1} color={row.color} />
                ))}
                <div className="pt-2 border-t border-gray-100 text-[12px] text-gray-500">
                  Fulfilled value: <strong className="text-green-700">{formatCurrency(soRevenue)}</strong>
                </div>
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">Purchase Orders</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Draft',    value: poDraft,    color: 'bg-gray-400'  },
                  { label: 'Sent',     value: poSent,     color: 'bg-blue-400'  },
                  { label: 'Received', value: poReceived, color: 'bg-green-500' },
                  { label: 'Cancelled', value: purchaseOrders.filter((p) => p.status === 'CANCELLED').length, color: 'bg-red-400' },
                ].map((row) => (
                  <MiniBar key={row.label} label={row.label} value={row.value} max={purchaseOrders.length || 1} color={row.color} />
                ))}
                <div className="pt-2 border-t border-gray-100 text-[12px] text-gray-500">
                  Received value: <strong className="text-green-700">{formatCurrency(poValue)}</strong>
                </div>
              </div>
            </Card>
          </div>

          {/* Tenant Admin — Divisions overview */}
          {isAdmin && divisions && divisions.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Building2 size={15} className="text-blue-500" />
                <h3 className="text-[14px] font-bold text-gray-900">Divisions Overview</h3>
                <span className="ml-auto text-[12px] text-gray-400">{divisions.length} division{divisions.length !== 1 ? 's' : ''}</span>
              </div>
              <Table>
                <Thead><Th>Division</Th><Th>Country</Th><Th>Email</Th><Th>Status</Th><Th>Created</Th></Thead>
                <Tbody>
                  {divisions.map((d) => (
                    <Tr key={d.id}>
                      <Td><p className="font-semibold text-gray-800">{d.name}</p></Td>
                      <Td className="text-gray-500">{d.country ?? '—'}</Td>
                      <Td className="text-gray-500">{d.contactEmail ?? '—'}</Td>
                      <Td><Badge variant={d.isActive ? 'green' : 'gray'}>{d.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                      <Td className="text-gray-400">{formatDate(d.createdAt)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* ══ INVOICES TAB ══ */}
      {tab === 'invoices' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue"   value={formatCurrency(totalRevenue)} sub="From fiscalized" icon={TrendingUp}    color="text-green-600" bg="bg-green-50"  />
            <KpiCard label="Total Paid"      value={formatCurrency(totalPaid)}    sub={`${invoices.filter(i=>i.invoicePaymentStatus==='PAID').length} invoices`}    icon={CheckCircle2}  color="text-green-600" bg="bg-green-50"  />
            <KpiCard label="Total Pending"   value={formatCurrency(totalPending)} sub={`${invoices.filter(i=>i.invoicePaymentStatus==='PENDING').length} invoices`}  icon={Clock}         color="text-amber-600" bg="bg-amber-50"  />
            <KpiCard label="Failed / Draft"  value={`${failedCount} / ${draftCount}`}  sub="Needs attention"  icon={XCircle}       color="text-red-500"   bg="bg-red-50"    />
          </div>

          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-gray-900">Recent Invoices</h3>
              <span className="text-[12px] text-gray-400">Latest {recentInvoices.length} of {invoices.length}</span>
            </div>
            <Table>
              <Thead><Th>Invoice #</Th><Th>Customer</Th><Th>Amount</Th><Th>VAT</Th><Th>Status</Th><Th>Payment</Th><Th>Date</Th></Thead>
              <Tbody>
                {invLoading ? <SkeletonRows cols={7} /> : recentInvoices.length === 0
                  ? <EmptyState message="No invoices yet." icon={<FileText size={28} />} />
                  : recentInvoices.map((inv) => (
                    <Tr key={inv.id}>
                      <Td><span className="font-mono text-[12px] font-semibold text-gray-700">{inv.invoiceNumber}</span></Td>
                      <Td className="font-semibold">{inv.customerName}</Td>
                      <Td className="font-bold">{formatCurrency(inv.totalAmount)}</Td>
                      <Td className="text-gray-500">{formatCurrency(inv.taxAmount)}</Td>
                      <Td><Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge></Td>
                      <Td>
                        {inv.invoicePaymentStatus
                          ? <Badge variant={inv.invoicePaymentStatus === 'PAID' ? 'green' : 'amber'}>{inv.invoicePaymentStatus}</Badge>
                          : <span className="text-gray-400">—</span>}
                      </Td>
                      <Td className="text-gray-400">{formatDate(inv.createdAt)}</Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </Card>

          {/* Top customers */}
          {invoices.length > 0 && (() => {
            const byCustomer = invoices.reduce<Record<string, { count: number; total: number }>>((acc, inv) => {
              const key = inv.customerName?.trim() || 'Unknown'
              acc[key] = acc[key] ?? { count: 0, total: 0 }
              acc[key].count++
              acc[key].total += inv.totalAmount
              return acc
            }, {})
            const sorted = Object.entries(byCustomer).sort((a, b) => b[1].total - a[1].total).slice(0, 5)
            return (
              <Card>
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-[14px] font-bold text-gray-900">Top Customers by Invoice Value</h3>
                </div>
                <div className="p-5 space-y-3">
                  {sorted.map(([name, data]) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
                        {(name[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{name}</p>
                        <p className="text-[11px] text-gray-400">{data.count} invoice{data.count !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="font-bold text-[13px] text-green-700 flex-shrink-0">{formatCurrency(data.total)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })()}
        </div>
      )}

      {/* ══ INVENTORY TAB ══ */}
      {tab === 'inventory' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Products"   value={products.length}               sub="In catalog"              icon={Package}         color="text-green-600"  bg="bg-green-50"   />
            <KpiCard label="Low Stock Items"  value={lowStock?.length ?? 0}          sub="Below reorder point"     icon={AlertTriangle}   color="text-red-500"    bg="bg-red-50"     />
            <KpiCard label="Total Stock In"   value={Math.round(stockIn)}            sub="Units received"          icon={ArrowUpCircle}   color="text-green-600"  bg="bg-green-50"   />
            <KpiCard label="Total Stock Out"  value={Math.round(stockOut)}           sub="Units dispatched/sold"   icon={ArrowDownCircle} color="text-red-500"    bg="bg-red-50"     />
          </div>

          {lowStock && lowStock.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 rounded-t-[12px] flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <h3 className="text-[14px] font-bold text-amber-800">Low Stock Alert — {lowStock.length} product{lowStock.length !== 1 ? 's' : ''}</h3>
              </div>
              <Table>
                <Thead><Th>Product</Th><Th>SKU</Th><Th>Warehouse</Th><Th>On Hand</Th><Th>Reorder Point</Th></Thead>
                <Tbody>
                  {lowStock.map((s) => (
                    <Tr key={`${s.productId}-${s.warehouseName}`}>
                      <Td className="font-semibold">{s.productName}</Td>
                      <Td><span className="font-mono text-[12px] text-gray-500">{s.sku ?? '—'}</span></Td>
                      <Td className="text-gray-500">{s.warehouseName}</Td>
                      <Td><span className="font-bold text-red-600">{s.quantity}</span></Td>
                      <Td className="text-gray-400">{s.reorderLevel}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}

          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-gray-900">Recent Stock Movements</h3>
              <span className="text-[12px] text-gray-400">Latest {recentMov.length} of {movements.length}</span>
            </div>
            <Table>
              <Thead><Th>Date</Th><Th>Product</Th><Th>Warehouse</Th><Th>Type</Th><Th>Qty</Th><Th>Reason</Th></Thead>
              <Tbody>
                {movLoading ? <SkeletonRows cols={6} /> : recentMov.length === 0
                  ? <EmptyState message="No stock movements recorded." icon={<Layers size={28} />} />
                  : recentMov.map((m) => (
                    <Tr key={m.id}>
                      <Td className="text-gray-400 text-[12px]">{formatDate(m.createdAt)}</Td>
                      <Td className="font-semibold">{m.productName ?? '—'}</Td>
                      <Td className="text-gray-500">{m.warehouseName ?? '—'}</Td>
                      <Td>
                        <Badge variant={movTypeBadge(m.movementType ?? '') as any}>
                          {(m.movementType ?? '').replace(/_/g, ' ')}
                        </Badge>
                      </Td>
                      <Td className={cn('font-bold', ['STOCK_IN','TRANSFER_IN'].includes(m.movementType ?? '') ? 'text-green-700' : 'text-red-600')}>
                        {['STOCK_OUT','TRANSFER_OUT','WRITE_OFF'].includes(m.movementType ?? '') ? '-' : '+'}{Number(m.quantity ?? 0).toFixed(2)}
                      </Td>
                      <Td className="text-gray-500 max-w-[160px] truncate">{m.reason ?? '—'}</Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ══ ORDERS TAB ══ */}
      {tab === 'orders' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Sales Orders"    value={salesOrders.length}     sub={`${soFulfilled} fulfilled`}  icon={ShoppingCart} color="text-purple-600" bg="bg-purple-50" />
            <KpiCard label="SO Revenue"      value={formatCurrency(soRevenue)} sub="From fulfilled SOs"       icon={TrendingUp}   color="text-green-600"  bg="bg-green-50"  />
            <KpiCard label="Purchase Orders" value={purchaseOrders.length}  sub={`${poReceived} received`}    icon={RefreshCw}    color="text-blue-600"   bg="bg-blue-50"   />
            <KpiCard label="PO Value"        value={formatCurrency(poValue)} sub="From received POs"          icon={Package}      color="text-green-600"  bg="bg-green-50"  />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">Sales Orders</h3>
              </div>
              <Table>
                <Thead><Th>SO Number</Th><Th>Customer</Th><Th>Amount</Th><Th>Status</Th><Th>Date</Th></Thead>
                <Tbody>
                  {soLoading ? <SkeletonRows cols={5} /> : salesOrders.length === 0
                    ? <EmptyState message="No sales orders yet." icon={<ShoppingCart size={28} />} />
                    : [...salesOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map((so) => (
                      <Tr key={so.id}>
                        <Td><span className="font-mono text-[12px] font-semibold text-gray-700">{so.soNumber ?? so.orderNumber}</span></Td>
                        <Td className="font-semibold">{so.customerName}</Td>
                        <Td className="font-bold">{formatCurrency(so.totalAmount)}</Td>
                        <Td>
                          <Badge variant={so.status === 'FULFILLED' ? 'green' : so.status === 'CONFIRMED' ? 'blue' : so.status === 'CANCELLED' ? 'red' : 'gray'}>
                            {so.status.replace('_', ' ')}
                          </Badge>
                        </Td>
                        <Td className="text-gray-400">{formatDate(so.createdAt)}</Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">Purchase Orders</h3>
              </div>
              <Table>
                <Thead><Th>PO Number</Th><Th>Supplier</Th><Th>Amount</Th><Th>Status</Th><Th>Date</Th></Thead>
                <Tbody>
                  {poLoading ? <SkeletonRows cols={5} /> : purchaseOrders.length === 0
                    ? <EmptyState message="No purchase orders yet." icon={<RefreshCw size={28} />} />
                    : [...purchaseOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map((po) => (
                      <Tr key={po.id}>
                        <Td><span className="font-mono text-[12px] font-semibold text-gray-700">{po.orderNumber}</span></Td>
                        <Td className="font-semibold">{po.supplierName ?? po.vendorName}</Td>
                        <Td className="font-bold">{formatCurrency(po.totalAmount)}</Td>
                        <Td>
                          <Badge variant={po.status === 'RECEIVED' ? 'green' : po.status === 'SENT' ? 'blue' : po.status === 'CANCELLED' ? 'red' : 'gray'}>
                            {po.status}
                          </Badge>
                        </Td>
                        <Td className="text-gray-400">{formatDate(po.createdAt)}</Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}