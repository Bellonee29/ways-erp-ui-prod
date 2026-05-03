'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, UserCheck, UserX, Trash2, Users, UserCog, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi } from '@/lib/api/users'
import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api/client'
import { Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState, SkeletonRows } from '@/components/ui/Table'
import Badge, { userRoleBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { useForm } from 'react-hook-form'

export default function UsersPage() {
  const qc = useQueryClient()
  const { isTenantAdmin } = useAuthStore()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showNewUser, setShowNewUser] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'pending'>('users')

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, admin: isTenantAdmin() }],
    queryFn: () =>
      (isTenantAdmin() ? usersApi.getAllUsers : usersApi.getMyUsers)({ page, size: 15 })
        .then((r) => r.data.data),
  })

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => usersApi.getStats().then((r) => r.data.data),
  })

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-managers'],
    queryFn: () => usersApi.getPendingManagers().then((r) => r.data.data),
    enabled: isTenantAdmin(),
  })

  const { register, handleSubmit, reset } = useForm<{ firstName: string; lastName: string; email: string }>()

  const createUserMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      toast.success('User created. Temporary password sent via email.')
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowNewUser(false)
      reset()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: usersApi.toggleActive,
    onSuccess: () => {
      toast.success('User status updated')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      toast.success('User deleted')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const approveMutation = useMutation({
    mutationFn: ({ managerId, approve }: { managerId: string; approve: boolean }) =>
      usersApi.approveManager({ managerId, approve }),
    onSuccess: (_, { approve }) => {
      toast.success(approve ? 'Manager approved' : 'Manager rejected')
      qc.invalidateQueries({ queryKey: ['pending-managers'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const users = data?.content ?? []
  const filtered = !search
    ? users
    : users.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      )

  const pendingCount = pendingData?.length ?? 0

  const TABS = isTenantAdmin()
    ? [{ key: 'users', label: 'All Users' }, { key: 'pending', label: `Pending Approvals${pendingCount ? ` (${pendingCount})` : ''}` }]
    : [{ key: 'users', label: 'My Users' }]

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
        <StatCard label={isTenantAdmin() ? 'Total Users'    : 'My Users'}    value={statsData?.totalUsers ?? statsData?.myManagedUsers ?? 0}    icon={<Users   size={20} className="text-green-600" />} color="green"  />
        <StatCard label="Active Users"     value={statsData?.activeUsers ?? 0}      icon={<UserCheck size={20} className="text-blue-500" />}   color="blue"   />
        <StatCard label="Inactive Users"   value={statsData?.inactiveUsers ?? 0}    icon={<UserX    size={20} className="text-amber-500" />}  color="amber"  />
        <StatCard label="Pending Managers" value={statsData?.pendingManagers ?? 0}  icon={<Clock    size={20} className="text-purple-500" />} color="purple" />
      </div>

      {/* Tabs */}
      {TABS.length > 1 && (
        <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1 w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`px-4 py-[7px] rounded-[6px] text-[13px] font-semibold transition-all ${
                activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Users tab ── */}
      {activeTab === 'users' && (
        <Card>
          <div className="flex items-center justify-between gap-3 px-[22px] py-[18px] border-b border-gray-100">
            <div className="flex items-center gap-2 bg-white border-[1.5px] border-gray-200 rounded-[6px] px-[14px] py-2 w-72 focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,.1)] transition-all">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder:text-gray-400"
              />
            </div>
            <Button icon={<Plus size={15} />} onClick={() => setShowNewUser(true)}>New User</Button>
          </div>

          <Table>
            <Thead>
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Joined</Th><Th>Actions</Th>
            </Thead>
            <Tbody>
              {isLoading ? (
                <SkeletonRows cols={6} />
              ) : filtered.length === 0 ? (
                <EmptyState message="No users found" icon={<Users size={28} />} />
              ) : filtered.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                        {(u.firstName[0] ?? u.email[0] ?? '?').toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800">{u.firstName} {u.lastName}</span>
                    </div>
                  </Td>
                  <Td className="text-gray-500">{u.email}</Td>
                  <Td><Badge variant={userRoleBadge(u.role)}>{u.role}</Badge></Td>
                  <Td><Badge variant={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                  <Td className="text-gray-400">{formatDate(u.createdAt)}</Td>
                  <Td>
                    <div className="flex gap-[6px]">
                      <button
                        onClick={() => toggleActiveMutation.mutate(u.id)}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                        className="w-[30px] h-[30px] rounded-[6px] bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(u.id) }}
                        title="Delete"
                        className="w-[30px] h-[30px] rounded-[6px] bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {data && data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={15} onPageChange={setPage} />
          )}
        </Card>
      )}

      {/* ── Pending approvals tab ── */}
      {activeTab === 'pending' && isTenantAdmin() && (
        <Card>
          <div className="px-[22px] py-[18px] border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800">Pending Manager Approvals</h3>
          </div>
          <Table>
            <Thead><Th>Manager</Th><Th>Email</Th><Th>Organisation</Th><Th>Registered</Th><Th>Actions</Th></Thead>
            <Tbody>
              {pendingLoading ? (
                <SkeletonRows cols={5} />
              ) : (pendingData ?? []).length === 0 ? (
                <EmptyState message="No pending approvals" icon={<UserCog size={28} />} />
              ) : (pendingData ?? []).map((m) => (
                <Tr key={m.id}>
                  <Td className="font-semibold">{m.firstName} {m.lastName}</Td>
                  <Td className="text-gray-500">{m.email}</Td>
                  <Td>{m.organizationName ?? '—'}</Td>
                  <Td className="text-gray-400">{formatDate(m.createdAt)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate({ managerId: m.id, approve: true })}
                        className="flex items-center gap-1 px-3 py-[6px] rounded-[6px] bg-green-50 text-green-700 text-[12px] font-semibold hover:bg-green-100 transition-colors"
                      >
                        <UserCheck size={13} /> Approve
                      </button>
                      <button
                        onClick={() => { if (confirm('Reject and delete this manager account?')) approveMutation.mutate({ managerId: m.id, approve: false }) }}
                        className="flex items-center gap-1 px-3 py-[6px] rounded-[6px] bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition-colors"
                      >
                        <UserX size={13} /> Reject
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* New user modal */}
      <Modal
        open={showNewUser}
        onClose={() => setShowNewUser(false)}
        title="Create New User"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewUser(false)}>Cancel</Button>
            <Button loading={createUserMutation.isPending} onClick={handleSubmit((v) => createUserMutation.mutate(v))}>
              Create User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-gray-500 bg-green-50 border border-green-200 rounded-[6px] p-3">
            A temporary password will be generated and sent to the user&apos;s email. They must change it on first login.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name" required
              {...register('firstName')}
              placeholder="e.g. Emeka"
              hint="User's first name as it will appear on their profile and documents"
            />
            <Input
              label="Last Name" required
              {...register('lastName')}
              placeholder="e.g. Nwosu"
              hint="User's last name or surname"
            />
          </div>
          <Input
            label="Email Address" type="email" required
            {...register('email')}
            placeholder="emeka@yourcompany.com"
            hint="A temporary password will be sent to this email. The user must change it on first login."
          />
        </div>
      </Modal>
    </div>
  )
}