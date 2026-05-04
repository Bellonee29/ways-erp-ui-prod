'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, PowerOff, Users, X, AlertCircle, Loader2 } from 'lucide-react'
import { divisionsApi } from '@/lib/api/divisions'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth'
import type { Division, CreateDivisionRequest } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ─── Create Division Modal ─────────────────────────────────────────────────────

function CreateDivisionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateDivisionRequest>({ name: '', contactEmail: '', country: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: divisionsApi.createDivision,
    onSuccess: () => { onSuccess(); onClose() },
    onError: (e: any) => setError(e?.response?.data?.message || 'Failed to create division'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold text-gray-900">Create Division</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-[13px]">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Division Name *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. North Region"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="division@company.com"
              value={form.contactEmail}
              onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Country</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nigeria"
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name.trim() || mutation.isPending}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[13px] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Create Division
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Division Admin Modal (full onboarding form) ───────────────────────

type AdminForm = {
  email: string
  password: string
  retypePassword: string
  organizationName: string
  tin: string
  phone: string
  street: string
  country: string
  postalCode: string
  businessDescription: string
}

const EMPTY_FORM: AdminForm = {
  email: '', password: '', retypePassword: '',
  organizationName: '', tin: '', phone: '',
  street: '', country: 'Nigeria', postalCode: '', businessDescription: '',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500'

function CreateAdminModal({
  division,
  onClose,
  onSuccess,
}: {
  division: Division
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState<AdminForm>(EMPTY_FORM)
  const [error, setError] = useState('')

  const set = (field: keyof AdminForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () =>
      authApi.register({
        ...form,
        divisionId: division.id,
      }),
    onSuccess: () => { onSuccess(); onClose() },
    onError: (e: any) => setError(e?.response?.data?.message || 'Failed to register admin'),
  })

  const canSubmit = form.email && form.password && form.retypePassword &&
    form.organizationName && form.phone && form.country && !mutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">Register Division Admin</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Division: <span className="font-medium text-gray-700">{division.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-[13px]">
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          <Field label="Organisation / Division Name *">
            <input className={inputCls} placeholder="e.g. North Region Office"
              value={form.organizationName} onChange={set('organizationName')} />
          </Field>

          <Field label="Email Address *">
            <input type="email" className={inputCls} placeholder="admin@company.com"
              value={form.email} onChange={set('email')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Password *">
              <input type="password" className={inputCls} placeholder="Min 8 characters"
                value={form.password} onChange={set('password')} />
            </Field>
            <Field label="Confirm Password *">
              <input type="password" className={inputCls} placeholder="Re-enter password"
                value={form.retypePassword} onChange={set('retypePassword')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone *">
              <input className={inputCls} placeholder="+234 800 000 0000"
                value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="TIN">
              <input className={inputCls} placeholder="Tax Identification No."
                value={form.tin} onChange={set('tin')} />
            </Field>
          </div>

          <Field label="Street Address">
            <input className={inputCls} placeholder="123 Main Street"
              value={form.street} onChange={set('street')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Country *">
              <input className={inputCls} placeholder="Nigeria"
                value={form.country} onChange={set('country')} />
            </Field>
            <Field label="Postal Code">
              <input className={inputCls} placeholder="100001"
                value={form.postalCode} onChange={set('postalCode')} />
            </Field>
          </div>

          <Field label="Business Description">
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="Brief description of this division's function..."
              value={form.businessDescription}
              onChange={set('businessDescription')} />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[13px] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Register Admin
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Division Card ─────────────────────────────────────────────────────────────

function DivisionCard({
  division,
  onCreateAdmin,
  onDeactivate,
}: {
  division: Division
  onCreateAdmin: (d: Division) => void
  onDeactivate: (d: Division) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-green-50 flex items-center justify-center">
            <Building2 size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-gray-900">{division.name}</h3>
            {division.contactEmail && (
              <p className="text-[12px] text-gray-500">{division.contactEmail}</p>
            )}
          </div>
        </div>
        <Badge active={division.isActive} />
      </div>

      {division.country && (
        <p className="text-[12px] text-gray-500">
          <span className="font-medium text-gray-600">Country:</span> {division.country}
        </p>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-50">
        <button
          onClick={() => onCreateAdmin(division)}
          disabled={!division.isActive}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Users size={13} /> Add Admin
        </button>
        <button
          onClick={() => onDeactivate(division)}
          disabled={!division.isActive}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <PowerOff size={13} /> Deactivate
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DivisionsPage() {
  const { isTenantAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [adminTarget, setAdminTarget] = useState<Division | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => divisionsApi.getDivisions().then(r => r.data.data),
    enabled: isTenantAdmin(),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => divisionsApi.deactivateDivision(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['divisions'] }),
  })

  if (!isTenantAdmin()) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-[14px]">
        Access restricted to Tenant Admins only.
      </div>
    )
  }

  const divisions = data ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Divisions</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage your organization's divisions and their administrators
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[13px] font-medium rounded-lg transition-colors"
        >
          <Plus size={15} /> New Division
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Divisions', value: divisions.length },
          { label: 'Active', value: divisions.filter(d => d.isActive).length },
          { label: 'Inactive', value: divisions.filter(d => !d.isActive).length },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[12px] text-gray-500">{stat.label}</p>
            <p className="text-[24px] font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-48 text-red-500 text-[13px]">
          Failed to load divisions.
        </div>
      ) : divisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Building2 size={40} className="mb-3 opacity-30" />
          <p className="text-[14px] font-medium">No divisions yet</p>
          <p className="text-[12px] mt-1">Create your first division to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-[13px] font-medium rounded-lg hover:bg-green-700"
          >
            <Plus size={14} /> Create Division
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {divisions.map(division => (
            <DivisionCard
              key={division.id}
              division={division}
              onCreateAdmin={setAdminTarget}
              onDeactivate={(d) => {
                if (window.confirm(`Deactivate "${d.name}"? Users in this division will lose access.`)) {
                  deactivateMutation.mutate(d.id)
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateDivisionModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['divisions'] })}
        />
      )}
      {adminTarget && (
        <CreateAdminModal
          division={adminTarget}
          onClose={() => setAdminTarget(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  )
}