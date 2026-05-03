'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { tenantsApi } from '@/lib/api/tenants'
import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api/client'
import { Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState, SkeletonRows } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TenantsPage() {
  const { isTenantAdmin } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isTenantAdmin()) router.replace('/dashboard')
  }, [isTenantAdmin, router])

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page],
    queryFn: () => tenantsApi.getAll({ page, size: 15 }).then((r) => r.data.data),
    enabled: isTenantAdmin(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? tenantsApi.deactivate(id) : tenantsApi.activate(id),
    onSuccess: () => {
      toast.success('Tenant status updated')
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const tenants = data?.content ?? []
  const filtered = !search
    ? tenants
    : tenants.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.domain ?? '').toLowerCase().includes(search.toLowerCase())
      )

  const activeCount   = tenants.filter((t) => t.isActive).length
  const inactiveCount = tenants.filter((t) => !t.isActive).length

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-[18px]">
        <StatCard label="Total Tenants"    value={data?.totalElements ?? 0} icon={<Building2    size={20} className="text-green-600" />} color="green"  />
        <StatCard label="Active Tenants"   value={activeCount}              icon={<ToggleRight  size={20} className="text-blue-500"  />} color="blue"   />
        <StatCard label="Inactive Tenants" value={inactiveCount}            icon={<ToggleLeft   size={20} className="text-amber-500" />} color="amber"  />
      </div>

      {/* Table */}
      <Card>
        <div className="flex items-center justify-between gap-3 px-[22px] py-[18px] border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-800">All Tenants</h3>
          <div className="flex items-center gap-2 bg-white border-[1.5px] border-gray-200 rounded-[6px] px-[14px] py-2 w-72 focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,.1)] transition-all">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or domain..."
              className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder:text-gray-400"
            />
          </div>
        </div>

        <Table>
          <Thead>
            <Th>Organisation</Th>
            <Th>Domain / Slug</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {isLoading ? (
              <SkeletonRows cols={5} rows={8} />
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
                        <p className="text-[12px] text-gray-400">{t.slug}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-[12.5px] text-gray-600 bg-gray-100 px-2 py-[3px] rounded">
                      {t.domain}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={t.isActive ? 'green' : 'gray'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-gray-400">{formatDate(t.createdAt)}</Td>
                  <Td>
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, active: t.isActive })}
                      disabled={toggleMutation.isPending}
                      title={t.isActive ? 'Deactivate tenant' : 'Activate tenant'}
                      className={`flex items-center gap-1 px-3 py-[6px] rounded-[6px] text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                        t.isActive
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {t.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      {t.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>

        {data && data.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            size={15}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  )
}