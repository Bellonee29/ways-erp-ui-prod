'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, Building2, Upload, CheckCircle2, ImageIcon,
  Shield, Mail, Phone, MapPin, Globe, Briefcase, Camera,
  Eye, EyeOff, ChevronRight, KeyRound, AlertCircle, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  settingsApi,
  type UploadCryptoKeyRequest,
  type UpdateFirsCredentialsRequest,
  type DivisionKeyStatusResponse,
} from '@/lib/api/settings'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/api/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn, getInitials } from '@/lib/utils'

/* ── schemas ── */
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  phone:     z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

type Tab = 'profile' | 'password' | 'logo' | 'firs' | 'firs-admin'

const ALL_TABS: { key: Tab; label: string; icon: React.ElementType; description: string; roles?: string[] }[] = [
  { key: 'profile',    label: 'My Profile',     icon: User,      description: 'Name, contact info' },
  { key: 'password',   label: 'Security',        icon: Shield,    description: 'Password & access' },
  { key: 'logo',       label: 'Company Logo',    icon: Building2, description: 'Branding & identity' },
  { key: 'firs',       label: 'FIRS Keys',       icon: KeyRound,  description: 'Crypto keys & credentials', roles: ['DIVISION_ADMIN'] },
  { key: 'firs-admin', label: 'Division Keys',   icon: KeyRound,  description: 'Manage division FIRS keys', roles: ['TENANT_ADMIN'] },
]

/* ── Password field with toggle ── */
function PasswordInput({ label, hint, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string; hint?: string; error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={cn(
            'w-full px-3 py-[10px] pr-10 border rounded-[8px] text-[13.5px] bg-gray-50 outline-none transition-all',
            'focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.12)]',
            error ? 'border-red-400 bg-red-50' : 'border-gray-200'
          )}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && !error && <p className="text-[11.5px] text-gray-400">{hint}</p>}
      {error && <p className="text-[11.5px] text-red-500">{error}</p>}
    </div>
  )
}

/* ── Strength meter ── */
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Symbol', ok: /[^a-zA-Z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i < score ? colors[score - 1] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {checks.map((c) => (
            <span key={c.label} className={cn('text-[11px] flex items-center gap-1', c.ok ? 'text-green-600' : 'text-gray-400')}>
              <span className={cn('w-1.5 h-1.5 rounded-full', c.ok ? 'bg-green-500' : 'bg-gray-300')} />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={cn('text-[11px] font-bold', score >= 3 ? 'text-green-600' : 'text-amber-600')}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('profile')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── Data ── */
  const { data: profileData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => settingsApi.getProfile().then((r) => r.data.data),
  })

  const { data: tenantData } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: () => settingsApi.getMyTenant().then((r) => r.data.data),
  })

  /* ── Profile form ── */
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profileData
      ? { firstName: profileData.firstName, lastName: profileData.lastName, phone: profileData.phone ?? '' }
      : undefined,
  })

  const updateProfileMutation = useMutation({
    mutationFn: settingsApi.updateProfile,
    onSuccess: (res) => {
      toast.success('Profile updated')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      if (user) setUser({ ...user, firstName: res.data.data.firstName, lastName: res.data.data.lastName })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /* ── Password form ── */
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const watchedPwd = passwordForm.watch('newPassword') ?? ''

  const changePasswordMutation = useMutation({
    mutationFn: settingsApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed. Please log in again.')
      passwordForm.reset()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /* ── Logo upload ── */
  function processFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Only image files are supported'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const uploadLogoMutation = useMutation({
    mutationFn: () => settingsApi.uploadLogo(logoFile!),
    onSuccess: () => {
      toast.success('Logo uploaded successfully')
      qc.invalidateQueries({ queryKey: ['my-tenant'] })
      setLogoFile(null)
      setLogoPreview(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const currentLogo = logoPreview ?? tenantData?.logoUrl ?? null
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'User'
  const isDivisionAdmin = user?.role === 'DIVISION_ADMIN'
  const isTenantAdmin = user?.role === 'TENANT_ADMIN'

  /* ── FIRS key status (read-only for DIVISION_ADMIN) ── */
  const { data: cryptoStatus, refetch: refetchCryptoStatus } = useQuery({
    queryKey: ['crypto-key-status'],
    queryFn: () => settingsApi.getCryptoKeyStatus().then((r) => r.data.data),
    enabled: isDivisionAdmin,
  })

  /* ── Division FIRS keys (TENANT_ADMIN) ── */
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null)
  const [expandedForm, setExpandedForm] = useState<'keys' | 'creds' | null>(null)
  const [divPublicKey, setDivPublicKey] = useState('')
  const [divCertificate, setDivCertificate] = useState('')
  const [divServiceId, setDivServiceId] = useState('')
  const [divBusinessId, setDivBusinessId] = useState('')

  const { data: divisionStatuses, refetch: refetchDivisionStatuses } = useQuery({
    queryKey: ['division-key-statuses'],
    queryFn: () => settingsApi.getDivisionKeyStatuses().then((r) => r.data.data),
    enabled: isTenantAdmin,
  })

  const uploadDivisionKeysMutation = useMutation({
    mutationFn: ({ divisionId, data }: { divisionId: string; data: UploadCryptoKeyRequest }) =>
      settingsApi.uploadKeysForDivision(divisionId, data),
    onSuccess: () => {
      toast.success('Keys uploaded successfully')
      setDivPublicKey('')
      setDivCertificate('')
      setExpandedForm(null)
      refetchDivisionStatuses()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateDivisionFirsMutation = useMutation({
    mutationFn: ({ divisionId, data }: { divisionId: string; data: UpdateFirsCredentialsRequest }) =>
      settingsApi.updateFirsCredentialsForDivision(divisionId, data),
    onSuccess: () => {
      toast.success('FIRS credentials updated')
      setDivServiceId('')
      setDivBusinessId('')
      setExpandedForm(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  function toggleDivisionSection(divisionId: string, form: 'keys' | 'creds') {
    if (expandedDivision === divisionId && expandedForm === form) {
      setExpandedDivision(null)
      setExpandedForm(null)
    } else {
      setExpandedDivision(divisionId)
      setExpandedForm(form)
      setDivPublicKey('')
      setDivCertificate('')
      setDivServiceId('')
      setDivBusinessId('')
    }
  }

  return (
    <div className="animate-fadeIn">
      {/* ── Page hero header ── */}
      <div className="relative mb-6 rounded-[14px] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-7 py-6">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-green-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-green-400/5 blur-xl pointer-events-none" />

        <div className="relative flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-extrabold text-[24px] shadow-lg">
              {getInitials(displayName)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-gray-900 flex items-center justify-center">
              <CheckCircle2 size={11} className="text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-extrabold text-white leading-tight">{displayName}</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                {user?.role}
              </span>
              {tenantData?.name && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                  <Briefcase size={10} /> {tenantData.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout: sidebar tabs + content ── */}
      <div className="flex gap-5 items-start">

        {/* ── Sidebar tabs ── */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {ALL_TABS.filter((t) => !t.roles || t.roles.includes(user?.role ?? '')).map(({ key, label, icon: Icon, description }) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-left transition-all duration-200 group',
                  active
                    ? 'bg-white shadow-sm border border-gray-200'
                    : 'hover:bg-white/60 hover:shadow-sm'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-all',
                  active
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-green-50 group-hover:text-green-500'
                )}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[13px] font-semibold leading-tight', active ? 'text-gray-900' : 'text-gray-600')}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
                </div>
                {active && <ChevronRight size={13} className="text-green-500 flex-shrink-0" />}
              </button>
            )
          })}

          {/* Divider + info card */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-[10px] p-3.5">
              <p className="text-[11px] font-bold text-green-700 mb-1">Need help?</p>
              <p className="text-[11px] text-green-600 leading-relaxed">
                Contact your administrator to change your email or organisation details.
              </p>
            </div>
          </div>
        </div>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">

          {/* ══ PROFILE TAB ══ */}
          {tab === 'profile' && (
            <div className="space-y-4">
              {/* Contact info card */}
              <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-bold text-gray-900">Personal Information</h2>
                    <p className="text-[12.5px] text-gray-500 mt-0.5">Update your name and contact details</p>
                  </div>
                  <div className="w-9 h-9 rounded-[10px] bg-blue-50 flex items-center justify-center">
                    <User size={16} className="text-blue-500" />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name" required
                      {...profileForm.register('firstName')}
                      error={profileForm.formState.errors.firstName?.message}
                    />
                    <Input
                      label="Last Name" required
                      {...profileForm.register('lastName')}
                      error={profileForm.formState.errors.lastName?.message}
                    />
                  </div>

                  {/* Read-only fields */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px]">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Email Address</p>
                        <p className="text-[13px] font-medium text-gray-700 mt-0.5 truncate">{user?.email}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                        Read only
                      </span>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Phone size={14} className="text-gray-400" />
                      </div>
                      <input
                        {...profileForm.register('phone')}
                        placeholder="+2348012345678"
                        className="w-full pl-9 pr-3 py-[10px] border border-gray-200 rounded-[8px] text-[13.5px] bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.12)] placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      loading={updateProfileMutation.isPending}
                      onClick={profileForm.handleSubmit((v) => updateProfileMutation.mutate(v))}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Account info card */}
              <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-bold text-gray-900">Account Details</h2>
                </div>
                <div className="p-6 grid grid-cols-2 gap-3">
                  {[
                    { icon: User,     label: 'Role',        value: user?.role },
                    { icon: Building2, label: 'Organisation', value: tenantData?.name ?? '—' },
                    { icon: Globe,    label: 'Country',     value: tenantData?.country ?? '—' },
                    { icon: Briefcase, label: 'Plan',        value: tenantData?.plan ?? '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-[8px] bg-gray-50 border border-gray-100">
                      <div className="w-7 h-7 rounded-[6px] bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Icon size={13} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                        <p className="text-[12.5px] font-semibold text-gray-800 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ PASSWORD TAB ══ */}
          {tab === 'password' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-bold text-gray-900">Change Password</h2>
                    <p className="text-[12.5px] text-gray-500 mt-0.5">Choose a strong, unique password</p>
                  </div>
                  <div className="w-9 h-9 rounded-[10px] bg-amber-50 flex items-center justify-center">
                    <Shield size={16} className="text-amber-500" />
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Warning banner */}
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[10px] p-4">
                    <Shield size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[12.5px] text-amber-700 leading-relaxed">
                      After changing your password you will be signed out and need to log in again with your new password.
                    </p>
                  </div>

                  <PasswordInput
                    label="Current Password"
                    hint="Enter your current password to verify your identity"
                    error={passwordForm.formState.errors.currentPassword?.message}
                    {...passwordForm.register('currentPassword')}
                  />

                  <div className="space-y-2">
                    <PasswordInput
                      label="New Password"
                      error={passwordForm.formState.errors.newPassword?.message}
                      {...passwordForm.register('newPassword')}
                    />
                    <PasswordStrength password={watchedPwd} />
                  </div>

                  <PasswordInput
                    label="Confirm New Password"
                    hint="Re-enter your new password to confirm"
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    {...passwordForm.register('confirmPassword')}
                  />

                  <div className="flex justify-end pt-1">
                    <Button
                      loading={changePasswordMutation.isPending}
                      onClick={passwordForm.handleSubmit((v) => changePasswordMutation.mutate(v))}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>

              {/* Security tips */}
              <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-[14px] font-bold text-gray-900">Security Tips</h2>
                </div>
                <div className="p-6 grid grid-cols-1 gap-2.5">
                  {[
                    'Use at least 12 characters for maximum security',
                    'Combine uppercase, lowercase, numbers and symbols',
                    'Never reuse a password from another account',
                    'Consider using a password manager',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[12.5px] text-gray-600">
                      <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ LOGO TAB ══ */}
          {tab === 'logo' && (
            <div className="space-y-4">
              {/* Current logo card */}
              <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-bold text-gray-900">Company Logo</h2>
                    <p className="text-[12.5px] text-gray-500 mt-0.5">
                      Appears on invoices, receipts and PDF exports
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-[10px] bg-purple-50 flex items-center justify-center">
                    <Building2 size={16} className="text-purple-500" />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Logo preview hero */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-[14px] border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden shadow-inner">
                        {currentLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={currentLogo} alt="Company logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <ImageIcon size={30} className="text-gray-300" />
                        )}
                      </div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shadow-md hover:bg-green-700 transition-colors"
                        title="Upload new logo"
                      >
                        <Camera size={13} />
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-900">
                        {tenantData?.logoUrl ? 'Logo uploaded' : 'No logo yet'}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                        PNG, JPG, or SVG · Max 2 MB<br />
                        Recommended: 256 × 256 px or larger
                      </p>
                      {tenantData?.logoUrl && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <CheckCircle2 size={13} className="text-green-600" />
                          <span className="text-[12px] text-green-700 font-semibold">Active — shows on all documents</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) processFile(file)
                    }}
                    className={cn(
                      'border-2 border-dashed rounded-[12px] p-7 text-center cursor-pointer transition-all duration-200',
                      dragOver
                        ? 'border-green-400 bg-green-50/60 scale-[1.01]'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-[12px] mx-auto mb-3 flex items-center justify-center transition-colors',
                      dragOver ? 'bg-green-100' : 'bg-gray-100'
                    )}>
                      <Upload size={20} className={dragOver ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <p className="text-[13.5px] font-semibold text-gray-700">
                      {logoFile ? logoFile.name : 'Drop your logo here, or click to browse'}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-1">PNG, JPG, SVG · up to 2 MB</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>

                  {/* Ready-to-upload banner */}
                  {logoFile && (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[10px] px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[8px] bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {logoPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logoPreview} alt="" className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <ImageIcon size={16} className="text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-800">{logoFile.name}</p>
                          <p className="text-[11.5px] text-gray-500">{(logoFile.size / 1024).toFixed(1)} KB — ready to upload</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                          className="text-[12px] text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                        >
                          Remove
                        </button>
                        <Button loading={uploadLogoMutation.isPending} onClick={() => uploadLogoMutation.mutate()}>
                          Upload
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Organisation info card */}
              {tenantData && (
                <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-[14px] font-bold text-gray-900">Organisation Info</h2>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-3">
                    {[
                      { icon: Building2,  label: 'Organisation', value: tenantData.name },
                      { icon: Briefcase,  label: 'Plan',          value: tenantData.plan ?? '—' },
                      { icon: Globe,      label: 'Domain',        value: tenantData.domain ?? '—' },
                      { icon: MapPin,     label: 'Country',       value: tenantData.country ?? '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-[8px] bg-gray-50 border border-gray-100">
                        <div className="w-7 h-7 rounded-[6px] bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Icon size={13} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                          <p className="text-[12.5px] font-semibold text-gray-800 mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ DIVISION FIRS KEYS TAB (TENANT_ADMIN) ══ */}
          {tab === 'firs-admin' && isTenantAdmin && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-bold text-gray-900">Division FIRS Keys</h2>
                    <p className="text-[12.5px] text-gray-500 mt-0.5">
                      Upload cryptographic keys and FIRS credentials for each division
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-[10px] bg-indigo-50 flex items-center justify-center">
                    <KeyRound size={16} className="text-indigo-500" />
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {!divisionStatuses || divisionStatuses.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[13px] text-gray-400">No divisions found. Create divisions first.</p>
                    </div>
                  ) : (
                    divisionStatuses.map((div: DivisionKeyStatusResponse) => {
                      const isExpanded = expandedDivision === div.divisionId
                      const hasKey = div.keyStatus?.hasActiveKey

                      return (
                        <div key={div.divisionId} className="p-5">
                          {/* Division header row */}
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-[10px] bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Building2 size={15} className="text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13.5px] font-bold text-gray-900">{div.divisionName}</p>
                              {div.contactEmail && (
                                <p className="text-[11.5px] text-gray-400 truncate">{div.contactEmail}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasKey ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                                  <CheckCircle2 size={10} /> Active Key
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                                  <AlertCircle size={10} /> No Key
                                </span>
                              )}
                              <button
                                onClick={() => toggleDivisionSection(div.divisionId, 'keys')}
                                className={cn(
                                  'text-[12px] font-semibold px-3 py-1.5 rounded-[7px] border transition-colors',
                                  isExpanded && expandedForm === 'keys'
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                                )}
                              >
                                {hasKey ? 'Replace Keys' : 'Upload Keys'}
                              </button>
                              <button
                                onClick={() => toggleDivisionSection(div.divisionId, 'creds')}
                                className={cn(
                                  'text-[12px] font-semibold px-3 py-1.5 rounded-[7px] border transition-colors',
                                  isExpanded && expandedForm === 'creds'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
                                )}
                              >
                                FIRS Credentials
                              </button>
                            </div>
                          </div>

                          {/* Key status detail */}
                          {hasKey && div.keyStatus && (
                            <div className="mt-3 ml-[52px] flex items-center gap-4 text-[11.5px] text-gray-500">
                              {div.keyStatus.uploadedAt && (
                                <span>Uploaded: {new Date(div.keyStatus.uploadedAt).toLocaleDateString()}</span>
                              )}
                              {div.keyStatus.uploadedBy && (
                                <span>By: {div.keyStatus.uploadedBy}</span>
                              )}
                              {div.keyStatus.expiresAt && (
                                <span>Expires: {new Date(div.keyStatus.expiresAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}

                          {/* Upload Keys form */}
                          {isExpanded && expandedForm === 'keys' && (
                            <div className="mt-4 ml-[52px] space-y-3 p-4 bg-gray-50 rounded-[10px] border border-gray-200">
                              <div>
                                <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                                  Public Key (PEM)
                                </label>
                                <textarea
                                  value={divPublicKey}
                                  onChange={(e) => setDivPublicKey(e.target.value)}
                                  placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                                  rows={4}
                                  className="w-full px-3 py-2.5 border border-gray-200 rounded-[8px] text-[12px] font-mono bg-white outline-none transition-all focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,.1)] resize-none"
                                />
                              </div>
                              <div>
                                <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                                  Certificate (PEM)
                                </label>
                                <textarea
                                  value={divCertificate}
                                  onChange={(e) => setDivCertificate(e.target.value)}
                                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                  rows={4}
                                  className="w-full px-3 py-2.5 border border-gray-200 rounded-[8px] text-[12px] font-mono bg-white outline-none transition-all focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,.1)] resize-none"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setExpandedDivision(null); setExpandedForm(null) }}>
                                  Cancel
                                </Button>
                                <Button
                                  loading={uploadDivisionKeysMutation.isPending}
                                  disabled={!divPublicKey.trim() || !divCertificate.trim()}
                                  onClick={() => uploadDivisionKeysMutation.mutate({
                                    divisionId: div.divisionId,
                                    data: { publicKey: divPublicKey, certificate: divCertificate },
                                  })}
                                >
                                  {hasKey ? 'Replace Keys' : 'Upload Keys'}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* FIRS Credentials form */}
                          {isExpanded && expandedForm === 'creds' && (
                            <div className="mt-4 ml-[52px] space-y-3 p-4 bg-gray-50 rounded-[10px] border border-gray-200">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                                    Service ID
                                  </label>
                                  <input
                                    value={divServiceId}
                                    onChange={(e) => setDivServiceId(e.target.value)}
                                    placeholder="e.g. SVC-001"
                                    className="w-full px-3 py-[10px] border border-gray-200 rounded-[8px] text-[13px] bg-white outline-none transition-all focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,.12)]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                                    Business ID
                                  </label>
                                  <input
                                    value={divBusinessId}
                                    onChange={(e) => setDivBusinessId(e.target.value)}
                                    placeholder="e.g. FIRS-BIZ-00123"
                                    className="w-full px-3 py-[10px] border border-gray-200 rounded-[8px] text-[13px] bg-white outline-none transition-all focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,.12)]"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setExpandedDivision(null); setExpandedForm(null) }}>
                                  Cancel
                                </Button>
                                <Button
                                  loading={updateDivisionFirsMutation.isPending}
                                  disabled={!divServiceId.trim() || !divBusinessId.trim()}
                                  onClick={() => updateDivisionFirsMutation.mutate({
                                    divisionId: div.divisionId,
                                    data: { serviceId: divServiceId, businessId: divBusinessId },
                                  })}
                                >
                                  Save Credentials
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ FIRS KEYS TAB ══ */}
          {tab === 'firs' && isDivisionAdmin && (
            <div className="space-y-4">

              {/* Key status card */}
              <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-bold text-gray-900">Cryptographic Key Status</h2>
                    <p className="text-[12.5px] text-gray-500 mt-0.5">FIRS certificate and public key for fiscalization</p>
                  </div>
                  <div className="w-9 h-9 rounded-[10px] bg-indigo-50 flex items-center justify-center">
                    <KeyRound size={16} className="text-indigo-500" />
                  </div>
                </div>
                <div className="p-6">
                  {cryptoStatus?.hasActiveKey ? (
                    <div className="flex items-start gap-4 bg-green-50 border border-green-200 rounded-[10px] p-4">
                      <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-[13.5px] font-bold text-green-800">Active key on file</p>
                        {cryptoStatus.uploadedAt && (
                          <p className="text-[12px] text-green-700">
                            Uploaded: {new Date(cryptoStatus.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                        {cryptoStatus.uploadedBy && (
                          <p className="text-[12px] text-green-700">By: {cryptoStatus.uploadedBy}</p>
                        )}
                        {cryptoStatus.expiresAt && (
                          <p className="text-[12px] text-green-700">
                            Expires: {new Date(cryptoStatus.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button onClick={() => refetchCryptoStatus()} className="text-green-600 hover:text-green-800 transition-colors">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[10px] p-4">
                      <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-amber-700">
                        No active key on file. Contact your system administrator to upload a FIRS key for your division.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}