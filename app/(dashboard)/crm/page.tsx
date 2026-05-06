'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, TrendingUp, Users, Target, CheckCircle2, Search, Phone, Mail,
  Building2, Trash2, Edit2, UserPlus, Globe, Activity, DollarSign,
  ArrowRight, Star, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { crmApi } from '@/lib/api/crm'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api/client'
import { Card, CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input, { Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonRows } from '@/components/ui/Table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { LeadStatus, Contact, CrmCompany, Deal } from '@/types'

/* ── Country list (ISO 3166-1 alpha-2) ── */
const COUNTRIES: { code: string; name: string }[] = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'SN', name: 'Senegal' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
]

/* ── Schemas ── */
const contactSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().optional(),
  email:     z.string().email('Invalid email').optional().or(z.literal('')),
  phone:     z.string().optional(),
  jobTitle:  z.string().optional(),
  tin:       z.string().optional(),
  address:   z.string().optional(),
  country:   z.string().optional(),
  postalZone: z.string().optional(),
  notes:     z.string().optional(),
  tags:      z.string().optional(),
})
type ContactForm = z.infer<typeof contactSchema>

const companySchema = z.object({
  name:     z.string().min(1, 'Company name required'),
  industry: z.string().optional(),
  website:  z.string().optional(),
  phone:    z.string().optional(),
  email:    z.string().email('Invalid email').optional().or(z.literal('')),
})
type CompanyForm = z.infer<typeof companySchema>

const leadSchema = z.object({
  firstName:      z.string().min(1, 'Required'),
  lastName:       z.string().optional(),
  email:          z.string().email('Invalid email').optional().or(z.literal('')),
  phone:          z.string().optional(),
  company:        z.string().optional(),
  source:         z.string().default('WEBSITE'),
  estimatedValue: z.coerce.number().min(0).optional(),
})
type LeadForm = z.infer<typeof leadSchema>

const dealSchema = z.object({
  title:       z.string().min(1, 'Title required'),
  value:       z.coerce.number().min(0, 'Value must be ≥ 0'),
  contactName: z.string().optional(),
  pipelineId:  z.string().min(1, 'Select a pipeline'),
  stageId:     z.string().min(1, 'Select a stage'),
})
type DealForm = z.infer<typeof dealSchema>

const activitySchema = z.object({
  type:        z.string().min(1, 'Required'),
  subject:     z.string().min(1, 'Subject required'),
  description: z.string().optional(),
  dueDate:     z.string().optional(),
})
type ActivityForm = z.infer<typeof activitySchema>

/* ── Badge maps ── */
const LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']
const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW:         'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED:   'bg-amber-100 text-amber-700 border-amber-200',
  QUALIFIED:   'bg-green-100 text-green-700 border-green-200',
  UNQUALIFIED: 'bg-red-100 text-red-600 border-red-200',
  CONVERTED:   'bg-purple-100 text-purple-700 border-purple-200',
}

type Tab = 'contacts' | 'companies' | 'leads' | 'deals' | 'activities'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'contacts',   label: 'Contacts',   icon: Users      },
  { key: 'companies',  label: 'Companies',  icon: Building2  },
  { key: 'leads',      label: 'Leads',      icon: Target     },
  { key: 'deals',      label: 'Pipeline',   icon: TrendingUp },
  { key: 'activities', label: 'Activities', icon: Activity   },
]

export default function CrmPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('contacts')
  const [showNewContact,  setShowNewContact]  = useState(false)
  const [showNewCompany,  setShowNewCompany]  = useState(false)
  const [showNewLead,     setShowNewLead]     = useState(false)
  const [showNewDeal,     setShowNewDeal]     = useState(false)
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [editContact,   setEditContact]   = useState<Contact | null>(null)
  const [editCompany,   setEditCompany]   = useState<CrmCompany | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [leadFilter,    setLeadFilter]    = useState<LeadStatus | 'ALL'>('ALL')
  const [selectedPipeline, setSelectedPipeline] = useState<string>('')

  /* ── Queries ── */
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['crm-contacts', contactSearch],
    queryFn: () => (
      contactSearch.length >= 2
        ? crmApi.searchContacts(contactSearch, { page: 0, size: 50 })
        : crmApi.getContacts({ page: 0, size: 50 })
    ).then((r) => r.data.data),
  })

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['crm-companies'],
    queryFn: () => crmApi.getCompanies({ page: 0, size: 50 }).then((r) => r.data.data),
  })

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['crm-leads', leadFilter],
    queryFn: () => (
      leadFilter === 'ALL'
        ? crmApi.getLeads({ page: 0, size: 100 })
        : crmApi.getLeadsByStatus(leadFilter, { page: 0, size: 100 })
    ).then((r) => r.data.data),
  })

  const { data: leadSummary } = useQuery({
    queryKey: ['crm-lead-summary'],
    queryFn: () => crmApi.getLeadSummary().then((r) => r.data.data),
  })

  const { data: pipelines } = useQuery({
    queryKey: ['crm-pipelines'],
    queryFn: () => crmApi.getPipelines().then((r) => r.data.data),
  })

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: () => crmApi.getDeals({ page: 0, size: 50 }).then((r) => r.data.data),
  })

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: () => crmApi.getActivities({ page: 0, size: 30 }).then((r) => r.data.data),
  })

  /* ── Contact mutations ── */
  const contactForm = useForm<ContactForm>({ resolver: zodResolver(contactSchema) })
  const editContactForm = useForm<ContactForm>({ resolver: zodResolver(contactSchema) })

  const createContactMutation = useMutation({
    mutationFn: crmApi.createContact,
    onSuccess: () => { toast.success('Contact created'); qc.invalidateQueries({ queryKey: ['crm-contacts'] }); setShowNewContact(false); contactForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactForm }) => crmApi.updateContact(id, data),
    onSuccess: () => { toast.success('Contact updated'); qc.invalidateQueries({ queryKey: ['crm-contacts'] }); setEditContact(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deleteContactMutation = useMutation({
    mutationFn: crmApi.deleteContact,
    onSuccess: () => { toast.success('Contact deleted'); qc.invalidateQueries({ queryKey: ['crm-contacts'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function openEditContact(c: Contact) {
    setEditContact(c)
    editContactForm.reset({
      firstName: c.firstName, lastName: c.lastName ?? '', email: c.email ?? '',
      phone: c.phone ?? '', jobTitle: c.jobTitle ?? '', tin: c.tin ?? '',
      address: c.address ?? '', country: c.country ?? '', postalZone: c.postalZone ?? '', notes: c.notes ?? '', tags: c.tags ?? '',
    })
  }

  /* ── Company mutations ── */
  const companyForm = useForm<CompanyForm>({ resolver: zodResolver(companySchema) })
  const editCompanyForm = useForm<CompanyForm>({ resolver: zodResolver(companySchema) })

  const createCompanyMutation = useMutation({
    mutationFn: crmApi.createCompany,
    onSuccess: () => { toast.success('Company added'); qc.invalidateQueries({ queryKey: ['crm-companies'] }); setShowNewCompany(false); companyForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyForm }) => crmApi.updateCompany(id, data),
    onSuccess: () => { toast.success('Company updated'); qc.invalidateQueries({ queryKey: ['crm-companies'] }); setEditCompany(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function openEditCompany(c: CrmCompany) {
    setEditCompany(c)
    editCompanyForm.reset({ name: c.name, industry: c.industry ?? '', website: c.website ?? '', phone: c.phone ?? '', email: c.email ?? '' })
  }

  /* ── Lead mutations ── */
  const leadForm = useForm<LeadForm>({ resolver: zodResolver(leadSchema) })
  const createLeadMutation = useMutation({
    mutationFn: crmApi.createLead,
    onSuccess: () => { toast.success('Lead created'); qc.invalidateQueries({ queryKey: ['crm-leads'] }); qc.invalidateQueries({ queryKey: ['crm-lead-summary'] }); setShowNewLead(false); leadForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => crmApi.updateLead(id, { status }),
    onSuccess: () => { toast.success('Lead updated'); qc.invalidateQueries({ queryKey: ['crm-leads'] }); qc.invalidateQueries({ queryKey: ['crm-lead-summary'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  /* ── Deal mutations ── */
  const dealForm = useForm<DealForm>({ resolver: zodResolver(dealSchema) })
  const createDealMutation = useMutation({
    mutationFn: (data: DealForm) => crmApi.createDeal({ title: data.title, value: data.value, contactName: data.contactName, stageId: data.stageId }),
    onSuccess: () => { toast.success('Deal created'); qc.invalidateQueries({ queryKey: ['crm-deals'] }); setShowNewDeal(false); dealForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const markWonMutation  = useMutation({ mutationFn: crmApi.markDealWon,  onSuccess: () => { toast.success('Deal marked as Won!');  qc.invalidateQueries({ queryKey: ['crm-deals'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })
  const markLostMutation = useMutation({ mutationFn: crmApi.markDealLost, onSuccess: () => { toast.success('Deal marked as Lost'); qc.invalidateQueries({ queryKey: ['crm-deals'] }) }, onError: (e) => toast.error(getErrorMessage(e)) })

  /* ── Activity mutations ── */
  const activityForm = useForm<ActivityForm>({ resolver: zodResolver(activitySchema) })
  const createActivityMutation = useMutation({
    mutationFn: crmApi.createActivity,
    onSuccess: () => { toast.success('Activity logged'); qc.invalidateQueries({ queryKey: ['crm-activities'] }); setShowNewActivity(false); activityForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const completeActivityMutation = useMutation({
    mutationFn: crmApi.completeActivity,
    onSuccess: () => { toast.success('Marked complete'); qc.invalidateQueries({ queryKey: ['crm-activities'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  /* ── Derived data ── */
  const contacts = contactsData?.content ?? []
  const companies = companiesData?.content ?? []
  const leads = leadsData?.content ?? []
  const deals = dealsData?.content ?? []
  const activities = activitiesData?.content ?? []

  const totalPipelineValue = deals.filter((d) => d.status === 'OPEN').reduce((s, d) => s + (d.value ?? 0), 0)
  const wonDeals = deals.filter((d) => d.status === 'WON').length

  const activePipeline = pipelines?.find((p) => p.id === selectedPipeline) ?? pipelines?.[0]

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Contacts',       value: contactsData?.totalElements ?? 0, icon: Users,        color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Companies',      value: companies.length,                  icon: Building2,    color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { label: 'Open Leads',     value: leads.filter((l) => l.status !== 'CONVERTED' && l.status !== 'UNQUALIFIED').length, icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Pipeline Value', value: formatCurrency(totalPipelineValue), icon: DollarSign,  color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Deals Won',      value: wonDeals,                          icon: Star,         color: 'text-green-600',  bg: 'bg-green-50'  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[12px] p-4 shadow-sm flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0', bg)}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
              <p className="text-[19px] font-extrabold text-gray-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-[7px] rounded-[6px] text-[13px] font-semibold transition-all',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ══ CONTACTS TAB ══ */}
      {tab === 'contacts' && (
        <Card>
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-white border-[1.5px] border-gray-200 rounded-[6px] px-3 py-2 w-72 focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,.1)] transition-all">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search contacts..." className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder:text-gray-400" />
            </div>
            <Button icon={<UserPlus size={15} />} onClick={() => setShowNewContact(true)}>New Contact</Button>
          </div>
          <div className="p-5">
            {contactsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : contacts.length === 0 ? (
              <EmptyState message={contactSearch ? `No results for "${contactSearch}"` : 'No contacts yet'} icon={<Users size={28} />} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((c) => (
                  <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-green-200 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-400 flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                          {(c.firstName[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-gray-900">{c.firstName} {c.lastName}</p>
                          {c.jobTitle && <p className="text-[12px] text-gray-400">{c.jobTitle}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditContact(c)} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-green-50 hover:text-green-600 flex items-center justify-center text-gray-400 transition-colors"><Edit2 size={12} /></button>
                        <button onClick={() => { if (confirm(`Delete ${c.firstName}?`)) deleteContactMutation.mutate(c.id) }} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {c.email && <div className="flex items-center gap-2 text-[12px] text-gray-500"><Mail size={11} className="text-gray-300" /><a href={`mailto:${c.email}`} className="hover:text-green-600 truncate">{c.email}</a></div>}
                      {c.phone && <div className="flex items-center gap-2 text-[12px] text-gray-500"><Phone size={11} className="text-gray-300" />{c.phone}</div>}
                      {c.companyName && <div className="flex items-center gap-2 text-[12px] text-gray-500"><Building2 size={11} className="text-gray-300" />{c.companyName}</div>}
                      {c.tin && <div className="flex items-center gap-2 text-[12px] text-gray-400">TIN: <span className="font-mono">{c.tin}</span></div>}
                    </div>
                    {c.tags && <div className="flex flex-wrap gap-1 mt-3">{c.tags.split(',').map((t) => <span key={t} className="text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{t.trim()}</span>)}</div>}
                    <p className="text-[11px] text-gray-300 mt-3">Added {formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ══ COMPANIES TAB ══ */}
      {tab === 'companies' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Companies</h3>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewCompany(true)}>Add Company</Button>
          </div>
          <Table>
            <Thead><Th>Company</Th><Th>Industry</Th><Th>Website</Th><Th>Email</Th><Th>Phone</Th><Th>Since</Th><Th> </Th></Thead>
            <Tbody>
              {companiesLoading ? <SkeletonRows cols={7} /> : companies.length === 0 ? (
                <EmptyState message="No companies yet. Add companies to group contacts and track deals." icon={<Building2 size={28} />} />
              ) : companies.map((co) => (
                <Tr key={co.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-800">{co.name}</span>
                    </div>
                  </Td>
                  <Td>{co.industry ?? '—'}</Td>
                  <Td>{co.website ? <a href={co.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-[12.5px]"><Globe size={11} /> {co.website.replace('https://', '')}</a> : '—'}</Td>
                  <Td>{co.email ?? '—'}</Td>
                  <Td>{co.phone ?? '—'}</Td>
                  <Td className="text-gray-400">{formatDate(co.createdAt)}</Td>
                  <Td>
                    <button onClick={() => openEditCompany(co)} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-green-50 hover:text-green-600 flex items-center justify-center text-gray-400 transition-colors"><Edit2 size={12} /></button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ LEADS TAB ══ */}
      {tab === 'leads' && (
        <div className="space-y-4">
          {/* Lead funnel summary */}
          {leadSummary && (
            <div className="grid grid-cols-5 gap-2">
              {LEAD_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setLeadFilter(leadFilter === s ? 'ALL' : s)}
                  className={cn(
                    'bg-white border rounded-[10px] p-3 text-center transition-all hover:shadow-sm',
                    leadFilter === s ? 'border-green-400 shadow-sm' : 'border-gray-200'
                  )}
                >
                  <p className="text-[20px] font-extrabold text-gray-900">{leadSummary[s] ?? 0}</p>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', STATUS_COLORS[s])}>{s}</span>
                </button>
              ))}
            </div>
          )}

          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-gray-900">Leads</h3>
                {leadFilter !== 'ALL' && (
                  <button onClick={() => setLeadFilter('ALL')} className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full hover:bg-gray-200">
                    Clear filter ×
                  </button>
                )}
              </div>
              <Button icon={<Plus size={14} />} onClick={() => setShowNewLead(true)}>New Lead</Button>
            </div>
            <Table>
              <Thead><Th>Name</Th><Th>Company</Th><Th>Source</Th><Th>Status</Th><Th>Value</Th><Th>Date</Th><Th>Actions</Th></Thead>
              <Tbody>
                {leadsLoading ? <SkeletonRows cols={7} /> : leads.length === 0 ? (
                  <EmptyState message="No leads found" />
                ) : leads.map((lead) => (
                  <Tr key={lead.id}>
                    <Td>
                      <p className="font-semibold text-gray-800">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[12px] text-gray-400">{lead.email}</p>
                    </Td>
                    <Td>{lead.company ?? '—'}</Td>
                    <Td><Badge variant="gray">{lead.source}</Badge></Td>
                    <Td><span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full border', STATUS_COLORS[lead.status as LeadStatus])}>{lead.status}</span></Td>
                    <Td className="font-semibold">{lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '—'}</Td>
                    <Td className="text-gray-400">{formatDate(lead.createdAt)}</Td>
                    <Td>
                      <div className="flex gap-1">
                        {lead.status !== 'CONTACTED' && lead.status !== 'CONVERTED' && (
                          <button
                            onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'CONTACTED' })}
                            className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors"
                            title="Mark as Contacted"
                          >Contact</button>
                        )}
                        {lead.status === 'CONTACTED' && (
                          <button
                            onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'QUALIFIED' })}
                            className="text-[11px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-full transition-colors"
                          >Qualify</button>
                        )}
                        {lead.status === 'QUALIFIED' && (
                          <button
                            onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'CONVERTED' })}
                            className="text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                          ><ArrowRight size={10} /> Convert</button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ══ DEALS / PIPELINE TAB ══ */}
      {tab === 'deals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {pipelines && pipelines.length > 1 && (
              <div className="flex gap-1 bg-gray-100 rounded-[8px] p-1">
                {pipelines.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPipeline(p.id)} className={cn('px-3 py-1.5 rounded-[6px] text-[13px] font-semibold transition-all', (activePipeline?.id === p.id) ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right">
                <p className="text-[11px] text-gray-400">Pipeline Value</p>
                <p className="text-[16px] font-extrabold text-green-700">{formatCurrency(totalPipelineValue)}</p>
              </div>
              <Button icon={<Plus size={14} />} onClick={() => setShowNewDeal(true)}>New Deal</Button>
            </div>
          </div>

          {/* Kanban board */}
          {!activePipeline ? (
            <Card><EmptyState message="No pipelines yet. Create a pipeline to track deals." /></Card>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {(activePipeline.stages ?? []).map((stage) => {
                  const stageDeals = (stage.deals ?? [])
                  const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0)
                  return (
                    <div key={stage.id} className="w-[260px] flex-shrink-0">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[12.5px] font-bold text-gray-700">{stage.name}</span>
                        <div className="flex items-center gap-1.5">
                          {stageDeals.length > 0 && <span className="text-[11px] text-gray-400">{formatCurrency(stageValue)}</span>}
                          <span className="text-[11px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                        </div>
                      </div>
                      <div className="bg-gray-100/80 rounded-[14px] p-2.5 min-h-[120px] space-y-2.5">
                        {stageDeals.length === 0 && (
                          <p className="text-[12px] text-gray-400 text-center py-5">No deals in this stage</p>
                        )}
                        {stageDeals.map((deal) => (
                          <div key={deal.id} className="bg-white rounded-[10px] p-3.5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[13px] font-bold text-gray-900">{deal.title}</p>
                            {deal.contactName && <p className="text-[11.5px] text-gray-400 mt-0.5 flex items-center gap-1"><Users size={10} />{deal.contactName}</p>}
                            <p className="text-[15px] font-extrabold text-green-600 mt-2">{formatCurrency(deal.value ?? 0)}</p>
                            <div className="flex gap-1.5 mt-3">
                              <button onClick={() => markWonMutation.mutate(deal.id)} className="flex-1 text-[10.5px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 py-1 rounded-[5px] transition-colors">Won</button>
                              <button onClick={() => markLostMutation.mutate(deal.id)} className="flex-1 text-[10.5px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 py-1 rounded-[5px] transition-colors">Lost</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* All deals table */}
          <Card>
            <CardHeader title="All Deals" />
            <Table>
              <Thead><Th>Title</Th><Th>Contact</Th><Th>Value</Th><Th>Status</Th><Th>Stage</Th><Th>Date</Th></Thead>
              <Tbody>
                {dealsLoading ? <SkeletonRows cols={6} /> : deals.length === 0 ? <EmptyState message="No deals yet" /> : deals.map((deal: Deal) => (
                  <Tr key={deal.id}>
                    <Td className="font-semibold">{deal.title}</Td>
                    <Td>{deal.contactName ?? '—'}</Td>
                    <Td className="font-bold text-green-700">{formatCurrency(deal.value ?? 0)}</Td>
                    <Td><Badge variant={deal.status === 'WON' ? 'green' : deal.status === 'LOST' ? 'red' : 'blue'}>{deal.status}</Badge></Td>
                    <Td className="text-gray-500">{deal.currentStage?.name ?? '—'}</Td>
                    <Td className="text-gray-400">{formatDate(deal.createdAt)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ══ ACTIVITIES TAB ══ */}
      {tab === 'activities' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Activity Log</h3>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewActivity(true)}>Log Activity</Button>
          </div>
          <div className="divide-y divide-gray-50">
            {activitiesLoading ? <div className="p-6"><SkeletonRows cols={4} rows={5} /></div>
            : activities.length === 0 ? <EmptyState message="No activities logged yet. Track calls, meetings, and tasks here." icon={<Activity size={28} />} />
            : activities.map((act) => (
              <div key={act.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', act.completed ? 'bg-green-100' : 'bg-amber-100')}>
                  {act.completed ? <CheckCircle2 size={16} className="text-green-600" /> : <Clock size={16} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13.5px] font-semibold text-gray-800">{act.subject}</p>
                      {act.description && <p className="text-[12.5px] text-gray-500 mt-0.5">{act.description}</p>}
                    </div>
                    <Badge variant="gray">{act.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[11.5px] text-gray-400">{formatDate(act.createdAt)}</p>
                    {act.dueDate && <p className="text-[11.5px] text-amber-500">Due: {formatDate(act.dueDate)}</p>}
                    {!act.completed && (
                      <button onClick={() => completeActivityMutation.mutate(act.id)} className="text-[11.5px] font-semibold text-green-600 hover:text-green-700">
                        Mark complete →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ══ MODALS ══ */}

      {/* New Contact */}
      <Modal open={showNewContact} onClose={() => { setShowNewContact(false); contactForm.reset() }} title="Add New Contact" size="md"
        footer={<><Button variant="outline" onClick={() => setShowNewContact(false)}>Cancel</Button><Button loading={createContactMutation.isPending} onClick={contactForm.handleSubmit((v) => createContactMutation.mutate(v))}>Save Contact</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required {...contactForm.register('firstName')} error={contactForm.formState.errors.firstName?.message} hint="Contact's first name" />
            <Input label="Last Name" {...contactForm.register('lastName')} hint="Surname or family name" />
            <Input label="Email" type="email" {...contactForm.register('email')} error={contactForm.formState.errors.email?.message} hint="Primary email for invoices" />
            <Input label="Phone" {...contactForm.register('phone')} placeholder="+2348012345678" hint="Phone number" />
            <Input label="Job Title" {...contactForm.register('jobTitle')} placeholder="Procurement Manager" className="col-span-2" hint="Role in their organisation" />
            <Input label="TIN" {...contactForm.register('tin')} placeholder="12345678-0001" hint="FIRS Tax ID — auto-filled on invoices" />
            <Input label="Address" {...contactForm.register('address')} placeholder="5 Marina Road, Lagos" hint="Billing address — auto-filled on invoices" />
            <Select label="Country" {...contactForm.register('country')} hint="Country of residence or operation">
              <option value="">— Select country —</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </Select>
            <Input label="Postal Zone" {...contactForm.register('postalZone')} placeholder="100001" hint="Postal / ZIP code" />
            <Input label="Tags" {...contactForm.register('tags')} placeholder="VIP, Lagos, Retail" className="col-span-2" hint="Comma-separated labels for categorisation" />
          </div>
        </div>
      </Modal>

      {/* Edit Contact */}
      <Modal open={!!editContact} onClose={() => setEditContact(null)} title={`Edit Contact — ${editContact?.firstName}`} size="md"
        footer={<><Button variant="outline" onClick={() => setEditContact(null)}>Cancel</Button><Button loading={updateContactMutation.isPending} onClick={editContactForm.handleSubmit((v) => updateContactMutation.mutate({ id: editContact!.id, data: v }))}>Save Changes</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" required {...editContactForm.register('firstName')} error={editContactForm.formState.errors.firstName?.message} hint="First name" />
          <Input label="Last Name" {...editContactForm.register('lastName')} hint="Surname" />
          <Input label="Email" type="email" {...editContactForm.register('email')} hint="Email" />
          <Input label="Phone" {...editContactForm.register('phone')} hint="Phone number" />
          <Input label="Job Title" {...editContactForm.register('jobTitle')} className="col-span-2" hint="Role in organisation" />
          <Input label="TIN" {...editContactForm.register('tin')} placeholder="12345678-0001" hint="FIRS Tax ID" />
          <Input label="Address" {...editContactForm.register('address')} hint="Billing address" />
          <Select label="Country" {...editContactForm.register('country')} hint="Country of residence or operation">
              <option value="">— Select country —</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </Select>
          <Input label="Postal Zone" {...editContactForm.register('postalZone')} placeholder="100001" hint="Postal / ZIP code" />
          <Input label="Tags" {...editContactForm.register('tags')} className="col-span-2" hint="Comma-separated tags" />
        </div>
      </Modal>

      {/* New Company */}
      <Modal open={showNewCompany} onClose={() => { setShowNewCompany(false); companyForm.reset() }} title="Add Company" size="md"
        footer={<><Button variant="outline" onClick={() => setShowNewCompany(false)}>Cancel</Button><Button loading={createCompanyMutation.isPending} onClick={companyForm.handleSubmit((v) => createCompanyMutation.mutate(v))}>Save Company</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company Name" required {...companyForm.register('name')} error={companyForm.formState.errors.name?.message} className="col-span-2" hint="Legal or trading name of the company" />
          <Input label="Industry" {...companyForm.register('industry')} placeholder="Manufacturing, Retail…" hint="Business sector or industry" />
          <Input label="Website" {...companyForm.register('website')} placeholder="https://company.com" hint="Company website URL" />
          <Input label="Email" type="email" {...companyForm.register('email')} error={companyForm.formState.errors.email?.message} hint="General enquiries email" />
          <Input label="Phone" {...companyForm.register('phone')} placeholder="+234…" hint="Main contact phone" />
        </div>
      </Modal>

      {/* Edit Company */}
      <Modal open={!!editCompany} onClose={() => setEditCompany(null)} title={`Edit — ${editCompany?.name}`} size="md"
        footer={<><Button variant="outline" onClick={() => setEditCompany(null)}>Cancel</Button><Button loading={updateCompanyMutation.isPending} onClick={editCompanyForm.handleSubmit((v) => updateCompanyMutation.mutate({ id: editCompany!.id, data: v }))}>Save Changes</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company Name" required {...editCompanyForm.register('name')} error={editCompanyForm.formState.errors.name?.message} className="col-span-2" hint="Company's legal or trading name" />
          <Input label="Industry" {...editCompanyForm.register('industry')} hint="Sector or industry" />
          <Input label="Website" {...editCompanyForm.register('website')} hint="Company website" />
          <Input label="Email" type="email" {...editCompanyForm.register('email')} hint="General email address" />
          <Input label="Phone" {...editCompanyForm.register('phone')} hint="Main contact number" />
        </div>
      </Modal>

      {/* New Lead */}
      <Modal open={showNewLead} onClose={() => { setShowNewLead(false); leadForm.reset() }} title="New Lead" size="md"
        footer={<><Button variant="outline" onClick={() => setShowNewLead(false)}>Cancel</Button><Button loading={createLeadMutation.isPending} onClick={leadForm.handleSubmit((v) => createLeadMutation.mutate(v as any))}>Create Lead</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" required {...leadForm.register('firstName')} error={leadForm.formState.errors.firstName?.message} hint="Lead's first name" />
          <Input label="Last Name" {...leadForm.register('lastName')} hint="Lead's surname" />
          <Input label="Email" type="email" {...leadForm.register('email')} error={leadForm.formState.errors.email?.message} hint="Email for follow-up" />
          <Input label="Phone" {...leadForm.register('phone')} placeholder="+2348012345678" hint="Phone for outreach" />
          <Input label="Company" {...leadForm.register('company')} placeholder="Zenith Supplies Ltd" hint="Company they represent" />
          <Input label="Estimated Value (₦)" type="number" {...leadForm.register('estimatedValue')} placeholder="500000" hint="Expected deal value for forecasting" />
          <Select label="Lead Source" {...leadForm.register('source')} className="col-span-2" hint="How this lead was acquired">
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="EMAIL">Email Campaign</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </Modal>

      {/* New Deal */}
      <Modal open={showNewDeal} onClose={() => { setShowNewDeal(false); dealForm.reset() }} title="New Deal" size="md"
        footer={<><Button variant="outline" onClick={() => setShowNewDeal(false)}>Cancel</Button><Button loading={createDealMutation.isPending} onClick={dealForm.handleSubmit((v) => createDealMutation.mutate(v))}>Create Deal</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Deal Title" required {...dealForm.register('title')} error={dealForm.formState.errors.title?.message} className="col-span-2" hint="A clear title for this deal — e.g. 'Zenith Supplies — Q2 PO'" />
          <Input label="Deal Value (₦)" required type="number" {...dealForm.register('value')} error={dealForm.formState.errors.value?.message} hint="Expected deal value in Naira" />
          <Input label="Contact Name" {...dealForm.register('contactName')} hint="Person managing this deal on the customer side" />
          <Select label="Pipeline" required {...dealForm.register('pipelineId')} error={dealForm.formState.errors.pipelineId?.message} hint="Which pipeline this deal belongs to">
            <option value="">Select pipeline…</option>
            {(pipelines ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Stage" required {...dealForm.register('stageId')} error={dealForm.formState.errors.stageId?.message} hint="Current stage of this deal">
            <option value="">Select stage…</option>
            {(pipelines?.find((p) => p.id === dealForm.watch('pipelineId'))?.stages ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      </Modal>

      {/* New Activity */}
      {/* <Modal open={showNewActivity} onClose={() => { setShowNewActivity(false); activityForm.reset() }} title="Log Activity" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowNewActivity(false)}>Cancel</Button><Button loading={createActivityMutation.isPending} onClick={activityForm.handleSubmit((v) => createActivityMutation.mutate(v))}>Log Activity</Button></>}>
        <div className="space-y-4">
          <Select label="Activity Type" required {...activityForm.register('type')} error={activityForm.formState.errors.type?.message} hint="Type of activity to log">
            <option value="">Select type…</option>
            <option value="CALL">Phone Call</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
            <option value="DEMO">Demo / Presentation</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="NOTE">Note</option>
          </Select>
          <Input label="Subject" required {...activityForm.register('subject')} error={activityForm.formState.errors.subject?.message} hint="Brief summary of the activity" />
          <Input label="Due Date" type="date" {...activityForm.register('dueDate')} hint="When this activity is due (optional)" />
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea {...activityForm.register('description')} rows={3} placeholder="Details about this activity…" className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none" />
          </div>
        </div>
      </Modal> */}

      {/* New Activity */}
      <Modal open={showNewActivity} onClose={() => { setShowNewActivity(false); activityForm.reset() }} title="Log Activity" size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setShowNewActivity(false)}>Cancel</Button>
          <Button
            loading={createActivityMutation.isPending}
            onClick={activityForm.handleSubmit((v) => {
              const payload = {
                ...v,
                dueDate: v.dueDate ? `${v.dueDate}T00:00:00` : null
              };
              createActivityMutation.mutate(payload);
            })}
          >
            Log Activity
          </Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Activity Type" required {...activityForm.register('type')} error={activityForm.formState.errors.type?.message} hint="Type of activity to log">
            <option value="">Select type…</option>
            <option value="CALL">Phone Call</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
            <option value="DEMO">Demo / Presentation</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="NOTE">Note</option>
          </Select>

          <Input label="Subject" required {...activityForm.register('subject')} error={activityForm.formState.errors.subject?.message} hint="Brief summary of the activity" />

          <Input label="Due Date" type="date" {...activityForm.register('dueDate')} hint="When this activity is due (optional)" />

          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea {...activityForm.register('description')} rows={3} placeholder="Details about this activity…" className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  )
}