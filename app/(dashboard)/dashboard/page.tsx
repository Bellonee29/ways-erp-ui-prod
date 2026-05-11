'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  FileText, Users, TrendingUp, UserPlus, ShoppingCart,
  AlertTriangle, CheckCircle2, Zap, ArrowUpRight,
  BarChart3, Activity, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { usersApi } from '@/lib/api/users'
import { invoicesApi } from '@/lib/api/invoices'
import { inventoryApi } from '@/lib/api/inventory'
import { crmApi } from '@/lib/api/crm'
import Badge, { invoiceStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, getInitials, cn } from '@/lib/utils'
import type { Invoice } from '@/types'

/* ── Tiny bar chart (CSS only) ── */
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-[5px] h-[80px]">
      {data.map(({ label, value }) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
            <div
              className="w-full rounded-t-[3px] bg-gradient-to-b from-green-400 to-green-600 transition-all group-hover:from-green-300 group-hover:to-green-500"
              style={{ height: `${Math.max((value / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400 leading-none">{label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── KPI Card ── */
function KpiCard({
  label, value, sub, trend, onClick,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: { value: string; up: boolean }
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-gray-200 rounded-[12px] p-5 shadow-sm transition-all',
        onClick && 'cursor-pointer hover:-translate-y-[2px] hover:shadow-md hover:border-green-200'
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[.06em] text-gray-400">{label}</p>
      <p className="text-[26px] font-extrabold text-gray-900 leading-tight mt-1">{value}</p>
      {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
      {trend && (
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1.5',
          trend.up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        )}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
  )
}

/* ── Invoice health donut (CSS rings) ── */
function InvoiceHealth({ draft, fiscalized, failed }: { draft: number; fiscalized: number; failed: number }) {
  const total = draft + fiscalized + failed || 1
  const items = [
    { label: 'Fiscalized', count: fiscalized, color: 'bg-green-500', pct: (fiscalized / total) * 100 },
    { label: 'Draft',      count: draft,      color: 'bg-amber-400', pct: (draft / total) * 100 },
    { label: 'Failed',     count: failed,     color: 'bg-red-400',   pct: (failed / total) * 100 },
  ]
  return (
    <div className="flex items-center gap-5">
      {/* Stacked bar */}
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-100 flex">
        {items.map(({ color, pct, label }) => (
          <div key={label} className={cn('h-full transition-all', color)} style={{ width: `${pct}%` }} />
        ))}
      </div>
      <div className="flex gap-3 flex-shrink-0">
        {items.map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', color)} />
            <span className="text-[11.5px] text-gray-500">{label}</span>
            <span className="text-[11.5px] font-bold text-gray-800">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Quick action button ── */
function QuickAction({ label, icon: Icon, href, color }: {
  label: string; icon: React.ElementType; href: string; color: string
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-all group w-full"
    >
      <div className={cn('w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={15} className="text-white" />
      </div>
      <span className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-900 flex-1 text-left">{label}</span>
      <ChevronRight size={13} className="text-gray-300 group-hover:text-green-500 transition-colors" />
    </button>
  )
}

function greetingByHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Build month sparkline from invoices ── */
function buildMonthlyChart(invoices: Invoice[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  const result: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    const total = invoices
      .filter((inv) => {
        const id = new Date(inv.createdAt)
        return id.getMonth() === m && id.getFullYear() === y && inv.status === 'FISCALIZED'
      })
      .reduce((s, inv) => s + inv.totalAmount, 0)
    result.push({ label: months[m], value: total })
  }
  return result
}

export default function DashboardPage() {
  const { user, isTenantAdmin } = useAuthStore()
  const router = useRouter()

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => usersApi.getStats().then((r) => r.data.data),
  })

  const { data: invoicesPage } = useQuery({
    queryKey: ['invoices-dashboard'],
    queryFn: () =>
      (isTenantAdmin() ? invoicesApi.getAllInvoices : invoicesApi.getMyInvoices)({ page: 0, size: 50 })
        .then((r) => r.data.data),
  })

  const { data: lowStockAlerts } = useQuery({
    queryKey: ['low-stock-dashboard'],
    queryFn: () => inventoryApi.getLowStockAlerts().then((r) => r.data.data),
  })

  const { data: leadSummary } = useQuery({
    queryKey: ['lead-summary-dashboard'],
    queryFn: () => crmApi.getLeadSummary().then((r) => r.data.data),
  })

  const { data: dealsPage } = useQuery({
    queryKey: ['deals-dashboard'],
    queryFn: () => crmApi.getDeals({ page: 0, size: 50 }).then((r) => r.data.data),
  })

  const invoices = invoicesPage?.content ?? []
  const recentInvoices = invoices.slice(0, 6)

  // Derived KPIs
  const totalRevenue  = invoices.filter((i) => i.status === 'FISCALIZED').reduce((s, i) => s + i.totalAmount, 0)
  const outstanding   = invoices.filter((i) => i.status === 'DRAFT' || i.status === 'PENDING').reduce((s, i) => s + i.totalAmount, 0)
  const fiscalizedCnt = invoices.filter((i) => i.fiscalizationStatus === 'COMPLETED').length
  const draftCnt      = invoices.filter((i) => i.status === 'DRAFT').length
  const failedCnt     = invoices.filter((i) => i.fiscalizationStatus === 'FAILED').length
  const totalInvoices = invoicesPage?.totalElements ?? 0

  const lowStockCount = lowStockAlerts?.length ?? 0
  const pipelineValue = (dealsPage?.content ?? []).filter((d) => d.status === 'OPEN').reduce((s, d) => s + (d.value ?? 0), 0)
  const openLeads     = (leadSummary?.NEW ?? 0) + (leadSummary?.CONTACTED ?? 0) + (leadSummary?.QUALIFIED ?? 0)

  const chartData = buildMonthlyChart(invoices)

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : ''

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-r from-gray-900 to-gray-800 px-7 py-5">
        <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-green-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-24 h-24 rounded-full bg-green-400/5 blur-xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[13px] text-gray-400">{greetingByHour()}</p>
            <h1 className="text-[21px] font-extrabold text-white mt-0.5">{displayName}</h1>
            <p className="text-[12.5px] text-gray-400 mt-1">
              Here's your business snapshot for today · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-green-400 bg-green-500/15 px-3 py-1.5 rounded-full">
              <Activity size={13} /> Live
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub="From fiscalized invoices"
          onClick={() => router.push('/invoices')}
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          sub={`${draftCnt} draft invoice${draftCnt !== 1 ? 's' : ''}`}
          onClick={() => router.push('/invoices')}
        />
        <KpiCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          sub={`${openLeads} open lead${openLeads !== 1 ? 's' : ''}`}
          onClick={() => router.push('/crm')}
        />
        <KpiCard
          label="Low Stock Items"
          value={lowStockCount}
          sub={lowStockCount > 0 ? 'Needs restocking' : 'All stock healthy'}
          onClick={() => router.push('/inventory')}
        />
      </div>

      {/* ── Secondary stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: totalInvoices, icon: FileText, cls: 'text-gray-600' },
          { label: 'Users',          value: statsData?.totalUsers ?? '—', icon: Users, cls: 'text-blue-600' },
          { label: 'Fiscalized',     value: fiscalizedCnt, icon: CheckCircle2, cls: 'text-green-600' },
          { label: 'Failed',         value: failedCnt, icon: AlertTriangle, cls: failedCnt > 0 ? 'text-red-500' : 'text-gray-400' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[10px] px-4 py-3.5 shadow-sm flex items-center gap-3">
            <Icon size={16} className={cn('flex-shrink-0', cls)} />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
              <p className="text-[18px] font-extrabold text-gray-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent invoices (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Recent Invoices</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Latest activity across all invoices</p>
              </div>
              <button
                onClick={() => router.push('/invoices')}
                className="flex items-center gap-1 text-[12px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors"
              >
                View all <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Invoice health bar */}
            <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
              <InvoiceHealth draft={draftCnt} fiscalized={fiscalizedCnt} failed={failedCnt} />
            </div>

            <div className="divide-y divide-gray-50">
              {recentInvoices.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <FileText size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-[13px] text-gray-400">No invoices yet — create your first one</p>
                  <button
                    onClick={() => router.push('/invoices')}
                    className="mt-3 text-[12px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-4 py-1.5 rounded-full transition-colors"
                  >
                    Create Invoice
                  </button>
                </div>
              ) : recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
                  onClick={() => router.push('/invoices')}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-[12px] font-bold text-green-700 flex-shrink-0">
                    {getInitials(inv.customerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-gray-800 truncate">{inv.customerName}</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                      {inv.invoiceNumber} · {formatDate(inv.issueDate ?? inv.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-bold text-gray-900">{formatCurrency(inv.totalAmount, inv.currency)}</p>
                    <Badge variant={invoiceStatusBadge(inv.status)} className="mt-0.5">{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue chart */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Revenue Trend</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Fiscalized invoice revenue — last 6 months</p>
              </div>
              <BarChart3 size={16} className="text-gray-300" />
            </div>
            <BarChart data={chartData} />
          </div>
        </div>

        {/* Right column (1/3 width) */}
        <div className="flex flex-col gap-4">

          {/* Quick actions */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm p-5">
            <h2 className="text-[14px] font-bold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction label="New Invoice"   icon={FileText}    href="/invoices"   color="bg-green-500" />
              <QuickAction label="Add Product"   icon={ShoppingCart} href="/inventory" color="bg-blue-500"  />
              <QuickAction label="New Lead"      icon={TrendingUp}  href="/crm"        color="bg-purple-500" />
              <QuickAction label="Add User"      icon={UserPlus}    href="/users"      color="bg-amber-500" />
            </div>
          </div>

          {/* Low stock alerts */}
          {lowStockCount > 0 && (
            <div className="bg-white border border-red-100 rounded-[12px] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-red-50 bg-red-50/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <h2 className="text-[13.5px] font-bold text-red-700">Low Stock Alerts</h2>
                </div>
                <span className="text-[11px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {lowStockCount}
                </span>
              </div>
              <div className="divide-y divide-red-50 max-h-[200px] overflow-y-auto">
                {(lowStockAlerts ?? []).slice(0, 6).map((item) => (
                  <div key={item.productId} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-[12.5px] font-semibold text-gray-800 truncate max-w-[130px]">{item.productName}</p>
                      <p className="text-[11px] text-gray-400">{item.warehouseName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-red-600">{Number(item.quantityOnHand ?? 0).toFixed(2)}</p>
                      <p className="text-[10.5px] text-gray-400">min {item.reorderPoint ?? '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-red-50">
                <button
                  onClick={() => router.push('/inventory')}
                  className="text-[12px] font-semibold text-red-600 hover:text-red-700"
                >
                  View all →
                </button>
              </div>
            </div>
          )}

          {/* CRM Lead funnel */}
          {leadSummary && (
            <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-bold text-gray-900">Lead Funnel</h2>
                <button onClick={() => router.push('/crm')} className="text-[11px] font-semibold text-green-600 hover:text-green-700">
                  View →
                </button>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'New',         key: 'NEW',         color: 'bg-blue-400'   },
                  { label: 'Contacted',   key: 'CONTACTED',   color: 'bg-amber-400'  },
                  { label: 'Qualified',   key: 'QUALIFIED',   color: 'bg-purple-400' },
                  { label: 'Converted',   key: 'CONVERTED',   color: 'bg-green-500'  },
                  { label: 'Unqualified', key: 'UNQUALIFIED', color: 'bg-gray-300'   },
                ].map(({ label, key, color }) => {
                  const count = leadSummary[key] ?? 0
                  const total = Object.values(leadSummary).reduce((a: number, b) => a + (b as number), 0) || 1
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[11.5px] text-gray-500 w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn('h-full rounded-full', color)} style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                      <span className="text-[11.5px] font-bold text-gray-700 w-5 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* User stats */}
          {isTenantAdmin() && statsData && (
            <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-bold text-gray-900">Team</h2>
                <button onClick={() => router.push('/users')} className="text-[11px] font-semibold text-green-600 hover:text-green-700">
                  Manage →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total Users',     value: statsData.totalUsers ?? 0 },
                  { label: 'Managers',        value: statsData.totalManagers ?? 0 },
                  { label: 'Active',          value: statsData.activeUsers ?? 0 },
                  { label: 'Pending',         value: statsData.pendingManagers ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-[8px] p-2.5 text-center">
                    <p className="text-[18px] font-extrabold text-gray-900">{value}</p>
                    <p className="text-[10.5px] text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {(statsData.pendingManagers ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-[8px] px-3 py-2">
                  <Zap size={12} className="text-amber-500 flex-shrink-0" />
                  <p className="text-[11.5px] text-amber-700 font-medium">
                    {statsData.pendingManagers} manager approval{statsData.pendingManagers !== 1 ? 's' : ''} pending
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}