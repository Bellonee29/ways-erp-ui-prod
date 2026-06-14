'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  BarChart3, FileText, CheckCircle2, XCircle, Clock,
  Download, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { analyticsApi } from '@/lib/api/analytics'
import { useAuthStore } from '@/store/auth'
import { Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonRows } from '@/components/ui/Table'
import { getErrorMessage } from '@/lib/api/client'

const PIE_COLORS = ['#16a34a', '#ef4444', '#f59e0b']

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'COMPLETED', label: 'Fiscalized (Completed)' },
  { value: 'FAILED',    label: 'Failed' },
]

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AnalyticsPage() {
  const { isSystemAdmin } = useAuthStore()
  const isAdmin = isSystemAdmin()

  // Date range — default: current year
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`)
  const [endDate, setEndDate]     = useState(now.toISOString().slice(0, 10))
  const [tenantId, setTenantId]   = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [exporting, setExporting] = useState(false)

  const params = {
    startDate,
    endDate,
    ...(tenantId ? { tenantId } : {}),
  }

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-summary', params],
    queryFn: () => analyticsApi.getSummary(params).then((r) => r.data.data),
  })

  const { data: monthly = [], isLoading: loadingMonthly } = useQuery({
    queryKey: ['analytics-monthly', params],
    queryFn: () => analyticsApi.getMonthly(params).then((r) => r.data.data),
  })

  const { data: tenantBreakdown = [], isLoading: loadingTenants } = useQuery({
    queryKey: ['analytics-tenants', startDate, endDate],
    queryFn: () => analyticsApi.getTenantBreakdown({ startDate, endDate }).then((r) => r.data.data),
    enabled: isAdmin,
  })

  async function handleExport(format: 'excel' | 'csv') {
    setExporting(true)
    try {
      const res = format === 'excel'
        ? await analyticsApi.exportExcel({ ...params, status: exportStatus || undefined })
        : await analyticsApi.exportCsv({ ...params, status: exportStatus || undefined })
      const ext = format === 'excel' ? 'xlsx' : 'csv'
      downloadBlob(res.data as Blob, `invoices_${startDate}_${endDate}.${ext}`)
      toast.success(`Export ready — ${format.toUpperCase()} downloaded`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  // Pie chart data
  const pieData = summary
    ? [
        { name: 'Fiscalized', value: summary.fiscalized },
        { name: 'Failed',     value: summary.failed },
        { name: 'Pending',    value: summary.pending },
      ]
    : []

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <Card padding>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Start Date</label>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-[1.5px] border-gray-200 rounded-[6px] px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-green-500"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">End Date</label>
            <input
              type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-[1.5px] border-gray-200 rounded-[6px] px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-green-500"
            />
          </div>
          {isAdmin && (
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Tenant ID (optional)</label>
              <input
                type="text" value={tenantId} placeholder="All tenants"
                onChange={(e) => setTenantId(e.target.value)}
                className="border-[1.5px] border-gray-200 rounded-[6px] px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-green-500 w-52"
              />
            </div>
          )}
          {/* Export controls */}
          <div className="ml-auto flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Export Filter</label>
              <select
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
                className="border-[1.5px] border-gray-200 rounded-[6px] px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-green-500"
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-green-600 text-white text-[13px] font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-gray-700 text-white text-[13px] font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              CSV
            </button>
          </div>
        </div>
      </Card>

      {/* ── Summary stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
        <StatCard
          label="Total Invoices"
          value={loadingSummary ? '…' : (summary?.totalInvoices ?? 0)}
          icon={<FileText size={20} className="text-green-600" />}
          color="green"
        />
        <StatCard
          label="Fiscalized"
          value={loadingSummary ? '…' : (summary?.fiscalized ?? 0)}
          icon={<CheckCircle2 size={20} className="text-blue-500" />}
          color="blue"
        />
        <StatCard
          label="Failed"
          value={loadingSummary ? '…' : (summary?.failed ?? 0)}
          icon={<XCircle size={20} className="text-amber-500" />}
          color="amber"
        />
        <StatCard
          label="Pending / Draft"
          value={loadingSummary ? '…' : (summary?.pending ?? 0)}
          icon={<Clock size={20} className="text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Revenue stat */}
      {summary && (
        <Card padding>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-gray-500">Total Fiscalized Revenue</p>
              <p className="text-[32px] font-extrabold text-gray-900 mt-1">
                ₦{summary.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-green-50 flex items-center justify-center">
              <BarChart3 size={22} className="text-green-600" />
            </div>
          </div>
        </Card>
      )}

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly bar chart */}
        <Card className="lg:col-span-2">
          <div className="px-[22px] py-[18px] border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800">Monthly Invoice Volume</h3>
          </div>
          <div className="p-5" style={{ height: 300 }}>
            {loadingMonthly ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-[13px]">Loading chart…</div>
            ) : monthly.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-[13px]">No data for the selected period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="fiscalized" name="Fiscalized" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed"     name="Failed"     fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total"      name="Total"      fill="#d1d5db" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Status pie */}
        <Card>
          <div className="px-[22px] py-[18px] border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800">Status Breakdown</h3>
          </div>
          <div className="p-5 flex flex-col items-center justify-center" style={{ height: 300 }}>
            {loadingSummary ? (
              <div className="text-gray-400 text-[13px]">Loading…</div>
            ) : (summary?.totalInvoices ?? 0) === 0 ? (
              <div className="text-gray-400 text-[13px]">No data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-1 flex-wrap justify-center">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-gray-600">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      {d.name}: <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly trend line */}
      {monthly.length > 0 && (
        <Card>
          <div className="px-[22px] py-[18px] border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800">Revenue Trend (Fiscalized)</h3>
          </div>
          <div className="p-5" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="amount" name="Revenue (₦)" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Tenant breakdown (admin only) ───────────────────────────────────── */}
      {isAdmin && (
        <Card>
          <div className="px-[22px] py-[18px] border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800">Per-Tenant Breakdown</h3>
          </div>
          <Table>
            <Thead>
              <Th>Tenant</Th>
              <Th>Total Invoices</Th>
              <Th>Fiscalized</Th>
              <Th>Revenue (₦)</Th>
            </Thead>
            <Tbody>
              {loadingTenants ? (
                <SkeletonRows cols={4} rows={5} />
              ) : tenantBreakdown.length === 0 ? (
                <EmptyState message="No data for selected period" icon={<BarChart3 size={32} />} />
              ) : (
                tenantBreakdown.map((row) => (
                  <Tr key={row.tenantId}>
                    <Td>
                      <div>
                        <p className="font-semibold text-gray-800">{row.tenantName}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{row.tenantId}</p>
                      </div>
                    </Td>
                    <Td className="font-semibold">{row.totalInvoices}</Td>
                    <Td>
                      <span className="px-2 py-[3px] rounded-full text-[12px] font-semibold bg-green-50 text-green-700">
                        {row.fiscalized}
                      </span>
                    </Td>
                    <Td className="font-semibold text-gray-800">
                      ₦{row.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}