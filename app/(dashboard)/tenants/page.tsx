'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Search, ToggleRight, CheckCircle2,
  XCircle, RefreshCw, CalendarDays, Clock, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi, type TenantDetail } from '@/lib/api/admin'
import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api/client'
import { Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState, SkeletonRows } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type ActionDialog = { type: 'renew'; tenant: TenantDetail } | null

export default function TenantsPage() {
  const { isSystemAdmin } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'pending'>('all')
  const [dialog, setDialog] = useState<ActionDialog>(null)
  const [renewMonths, setRenewMonths] = useState(12)

  useEffect(() => {
    if (!isSystemAdmin()) router.replace('/dashboard')
  }, [isSystemAdmin, router])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-tenants', page, tab],
    queryFn: async () => {
      if (tab === 'pending') {
        const r = await adminApi.getPendingTenants()
        const list = r.data.data
        return { content: list, totalElements: list.length, totalPages: 1 }
      }
      const r = await adminApi.getAllTenants(page, 15)
      return r.data.data
    },
    enabled: isSystemAdmin(),
  })

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error))
  }, [isError, error])

  const approve = useMutation({
    mutationFn: (id: string) => adminApi.approveTenant(id),
    onSuccess: () => { toast.success('Tenant approved'); qc.invalidateQueries({ queryKey: ['admin-tenants'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const disable = useMutation({
    mutationFn: (id: string) => adminApi.disableTenant(id),
    onSuccess: () => { toast.success('Tenant and all users disabled'); qc.invalidateQueries({ queryKey: ['admin-tenants'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const enable = useMutation({
    mutationFn: (id: string) => adminApi.enableTenant(id),
    onSuccess: () => { toast.success('Tenant enabled'); qc.invalidateQueries({ queryKey: ['admin-tenants'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const renew = useMutation({
    mutationFn: ({ id, months }: { id: string; months: number }) => adminApi.renewLicense(id, months),
    onSuccess: () => { toast.success('License renewed successfully'); qc.invalidateQueries({ queryKey: ['admin-tenants'] }); setDialog(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const tenants: TenantDetail[] = data?.content ?? []
  const filtered = !search
    ? tenants
    : tenants.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.organizationName ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (t.domain ?? '').toLowerCase().includes(search.toLowerCase())
      )

  const activeCount = tenants.filter((t) => t.isActive).length
  const pendingCount = tenants.filter((t) => !t.isApproved).length
  const expiredCount = tenants.filter((t) => t.isExpired).length

  const isPending = approve.isPending || disable.isPending || enable.isPending || renew.isPending

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
        <StatCard label="Total Tenants"    value={data?.totalElements ?? 0} icon={<Building2   size={20} className="text-green-600" />} color="green"  />
        <StatCard label="Active"           value={activeCount}              icon={<ToggleRight  size={20} className="text-blue-500"  />} color="blue"   />
        <StatCard label="Pending Approval" value={pendingCount}             icon={<Clock        size={20} className="text-amber-500" />} color="amber"  />
        <StatCard label="Expired Licences" value={expiredCount}             icon={<CalendarDays size={20} className="text-purple-500" />} color="purple" />
      </div>

      {/* Table */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] py-[18px] border-b border-gray-100">
          <div className="flex gap-2">
            {(['all', 'pending'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(0) }}
                className={`px-4 py-[6px] rounded-[6px] text-[13px] font-semibold transition-colors ${
                  tab === t
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? 'All Tenants' : 'Pending Approval'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border-[1.5px] border-gray-200 rounded-[6px] px-[14px] py-2 w-72 focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,.1)] transition-all">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants..."
              className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder:text-gray-400"
            />
          </div>
        </div>

        <Table>
          <Thead>
            <Th>Organisation</Th>
            <Th>Admin</Th>
            <Th>Subscription</Th>
            <Th>Users</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {isLoading ? (
              <SkeletonRows cols={6} rows={8} />
            ) : isError ? (
              <EmptyState message={getErrorMessage(error)} icon={<XCircle size={32} className="text-red-400" />} />
            ) : filtered.length === 0 ? (
              <EmptyState message="No tenants found" icon={<Building2 size={32} />} />
            ) : (
              filtered.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                        {t.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{t.organizationName || t.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{t.domain}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-[13px] text-gray-700">{t.adminName || '—'}</p>
                      <p className="text-[11px] text-gray-400">{t.adminEmail || ''}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-[2px]">
                      <span className={`text-[12px] font-medium ${t.isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                        {t.isExpired ? '⚠ Expired' : 'Active until'}
                      </span>
                      <span className="text-[12px] text-gray-400">
                        {t.endDate ? formatDate(t.endDate) : '—'}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 text-[13px] text-gray-600">
                      <Users size={13} />
                      {t.totalUsers}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-[3px]">
                      <Badge variant={t.isActive ? 'green' : 'gray'}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {!t.isApproved && (
                        <Badge variant="amber">Pending</Badge>
                      )}
                      {t.isExpired && (
                        <Badge variant="red">Expired</Badge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-[6px]">
                      {/* Approve */}
                      {!t.isApproved && (
                        <button
                          onClick={() => approve.mutate(t.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-[12px] font-semibold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 size={13} />
                          Approve
                        </button>
                      )}
                      {/* Disable */}
                      {t.isActive && t.isApproved && (
                        <button
                          onClick={() => disable.mutate(t.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-[12px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={13} />
                          Disable
                        </button>
                      )}
                      {/* Enable */}
                      {!t.isActive && t.isApproved && (
                        <button
                          onClick={() => enable.mutate(t.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-[12px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          <ToggleRight size={13} />
                          Enable
                        </button>
                      )}
                      {/* Renew */}
                      {t.isApproved && (
                        <button
                          onClick={() => { setDialog({ type: 'renew', tenant: t }); setRenewMonths(12) }}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-[12px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw size={13} />
                          Renew
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>

        {data && (data as any).totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={(data as any).totalPages}
            totalElements={data.totalElements}
            size={15}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* Renew dialog */}
      {dialog?.type === 'renew' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setDialog(null)} />
          <div className="relative bg-white rounded-[14px] shadow-2xl w-full max-w-sm mx-4 p-7 flex flex-col gap-4">
            <h3 className="text-[17px] font-bold text-gray-900">Renew Licence</h3>
            <p className="text-[13px] text-gray-500">
              Renewing licence for <span className="font-semibold text-gray-800">{dialog.tenant.organizationName}</span>.
              Current expiry: <span className="font-semibold">{dialog.tenant.endDate ? formatDate(dialog.tenant.endDate) : 'None'}</span>.
            </p>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-semibold text-gray-700">Extension (months)</label>
              <select
                value={renewMonths}
                onChange={(e) => setRenewMonths(Number(e.target.value))}
                className="border-[1.5px] border-gray-200 rounded-[6px] px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-green-500"
              >
                {[1, 3, 6, 12, 24].map((m) => (
                  <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setDialog(null)}
                className="flex-1 py-2.5 rounded-[8px] border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => renew.mutate({ id: dialog.tenant.id, months: renewMonths })}
                disabled={renew.isPending}
                className="flex-1 py-2.5 rounded-[8px] bg-green-600 text-white text-[13px] font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {renew.isPending ? 'Renewing...' : `Renew ${renewMonths}m`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}