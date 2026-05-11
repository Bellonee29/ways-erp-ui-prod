'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BookOpen, Receipt, TrendingUp, Plus, CheckCircle2, Trash2,
  DollarSign, ArrowUpRight, ArrowDownLeft, BarChart3, Building2,
  FileText, Edit2, Filter, Download,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { accountingApi } from '@/lib/api/accounting'
import { divisionsApi } from '@/lib/api/divisions'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import { Card, CardHeader } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonRows } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input, { Select } from '@/components/ui/Input'
import type { AccountType, BankAccount } from '@/types'

/* ── Schemas ── */
const accountSchema = z.object({
  code:        z.string().min(1, 'Account code required'),
  name:        z.string().min(1, 'Account name required'),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  description: z.string().optional(),
})
type AccountForm = z.infer<typeof accountSchema>

const bankSchema = z.object({
  bankName:      z.string().min(1, 'Bank name required'),
  accountName:   z.string().min(1, 'Account name required'),
  accountNumber: z.string().min(10, 'Must be at least 10 digits'),
  currency:      z.string().default('NGN'),
})
type BankForm = z.infer<typeof bankSchema>

const billSchema = z.object({
  vendorName:  z.string().min(1, 'Vendor name required'),
  billNumber:  z.string().min(1, 'Bill number required'),
  totalAmount: z.coerce.number().positive('Must be > 0'),
  dueDate:     z.string().min(1, 'Due date required'),
  description: z.string().optional(),
})
type BillForm = z.infer<typeof billSchema>

const journalLineSchema = z.object({
  accountId:    z.string().min(1, 'Select an account'),
  description:  z.string().optional(),
  debitAmount:  z.coerce.number().min(0).default(0),
  creditAmount: z.coerce.number().min(0).default(0),
})
const journalSchema = z.object({
  description: z.string().min(1, 'Description required'),
  entryDate:   z.string().min(1, 'Date required'),
  reference:   z.string().optional(),
  lines:       z.array(journalLineSchema).min(2, 'Add at least two lines'),
})
type JournalForm = z.infer<typeof journalSchema>

const paymentSchema = z.object({
  amount:        z.coerce.number().positive('Amount must be > 0'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CARD', 'CHEQUE']),
  paymentDate:   z.string().min(1, 'Date required'),
  reference:     z.string().optional(),
  notes:         z.string().optional(),
})
type PaymentForm = z.infer<typeof paymentSchema>

type Tab = 'overview' | 'accounts' | 'journals' | 'bills' | 'banks' | 'reports'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview',  label: 'Overview',        icon: BarChart3  },
  { key: 'accounts',  label: 'Chart of Accounts', icon: BookOpen  },
  { key: 'journals',  label: 'Journal Entries',  icon: FileText   },
  { key: 'bills',     label: 'Bills',            icon: Receipt    },
  { key: 'banks',     label: 'Bank Accounts',    icon: Building2  },
  { key: 'reports',   label: 'Reports',          icon: TrendingUp },
]

const accountTypeBadge: Record<AccountType, 'green' | 'blue' | 'amber' | 'red' | 'gray'> = {
  ASSET: 'green', LIABILITY: 'red', EQUITY: 'blue', REVENUE: 'amber', EXPENSE: 'gray',
}

const accountTypeColors: Record<AccountType, string> = {
  ASSET:     'bg-green-50 text-green-700',
  LIABILITY: 'bg-red-50 text-red-700',
  EQUITY:    'bg-blue-50 text-blue-700',
  REVENUE:   'bg-amber-50 text-amber-700',
  EXPENSE:   'bg-gray-100 text-gray-700',
}

/* ── Mini sparkline bar ── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  )
}

export default function AccountingPage() {
  const qc = useQueryClient()
  const { isTenantAdmin, isTenantUser } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [divisionFilter, setDivisionFilter] = useState('')
  const [showNewAccount, setShowNewAccount]  = useState(false)
  const [showNewBank,    setShowNewBank]     = useState(false)
  const [showNewBill,    setShowNewBill]     = useState(false)
  const [showNewJournal, setShowNewJournal]  = useState(false)
  const [showPayBill,    setShowPayBill]     = useState(false)
  const [payingBill,     setPayingBill]      = useState<any>(null)
  const [editBank, setEditBank] = useState<BankAccount | null>(null)

  /* ── Queries ── */
  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => divisionsApi.getDivisions().then((r) => r.data.data),
    enabled: isTenantAdmin(),
  })

  const divParams = divisionFilter ? { divisionTenantId: divisionFilter } : {}

  const { data: accounts, isLoading: coaLoading } = useQuery({
    queryKey: ['accounting-coa', divisionFilter],
    queryFn: () => accountingApi.getAccounts({ page: 0, size: 100, ...divParams }).then((r) => r.data.data),
  })

  const { data: journals, isLoading: journalLoading } = useQuery({
    queryKey: ['accounting-journals', divisionFilter],
    queryFn: () => accountingApi.getJournalEntries({ page: 0, size: 30, ...divParams }).then((r) => r.data.data),
    enabled: tab === 'journals',
  })

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ['accounting-bills', divisionFilter],
    queryFn: () => accountingApi.getBills({ page: 0, size: 30, ...divParams }).then((r) => r.data.data),
  })

  const { data: bankAccounts, isLoading: banksLoading } = useQuery({
    queryKey: ['accounting-banks'],
    queryFn: () => accountingApi.getBankAccounts({ page: 0, size: 20 }).then((r) => r.data.data),
  })

  const { data: trialBalance, isLoading: tbLoading } = useQuery({
    queryKey: ['accounting-trial-balance'],
    queryFn: () => accountingApi.getTrialBalance().then((r) => r.data.data),
    enabled: tab === 'reports',
  })

  const { data: pnlData, isLoading: pnlLoading } = useQuery({
    queryKey: ['accounting-pnl'],
    queryFn: () => accountingApi.getProfitAndLoss().then((r) => r.data.data as any),
    enabled: tab === 'reports',
  })

  const { data: bsData, isLoading: bsLoading } = useQuery({
    queryKey: ['accounting-bs'],
    queryFn: () => accountingApi.getBalanceSheet().then((r) => r.data.data as any),
    enabled: tab === 'reports',
  })

  /* ── Derived data ── */
  const accs = Array.isArray(accounts) ? accounts : []
  const billList = bills?.content ?? []
  const bankList: BankAccount[] = Array.isArray(bankAccounts) ? bankAccounts : (bankAccounts?.content ?? [])

  const assetTotal    = accs.filter((a) => a.accountType === 'ASSET').reduce((s, a) => s + (a.balance ?? 0), 0)
  const liabilityTotal= accs.filter((a) => a.accountType === 'LIABILITY').reduce((s, a) => s + (a.balance ?? 0), 0)
  const revenueTotal  = accs.filter((a) => a.accountType === 'REVENUE').reduce((s, a) => s + (a.balance ?? 0), 0)
  const expenseTotal  = accs.filter((a) => a.accountType === 'EXPENSE').reduce((s, a) => s + (a.balance ?? 0), 0)
  const netIncome     = revenueTotal - expenseTotal
  const totalBankBalance = bankList.reduce((s, b) => s + (b.balance ?? 0), 0)

  const pendingBills = billList.filter((b) => b.status === 'DRAFT' || b.status === 'PENDING')
  const totalPendingBills = pendingBills.reduce((s, b) => s + b.totalAmount, 0)

  /* ── Mutations ── */
  const accountForm = useForm<AccountForm>({ resolver: zodResolver(accountSchema), defaultValues: { accountType: 'ASSET' } })
  const createAccountMutation = useMutation({
    mutationFn: accountingApi.createAccount,
    onSuccess: () => { toast.success('Account created'); qc.invalidateQueries({ queryKey: ['accounting-coa'] }); setShowNewAccount(false); accountForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const bankForm = useForm<BankForm>({ resolver: zodResolver(bankSchema), defaultValues: { currency: 'NGN' } })
  const editBankForm = useForm<BankForm>({ resolver: zodResolver(bankSchema) })
  const createBankMutation = useMutation({
    mutationFn: accountingApi.createBankAccount,
    onSuccess: () => { toast.success('Bank account added'); qc.invalidateQueries({ queryKey: ['accounting-banks'] }); setShowNewBank(false); bankForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateBankMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BankForm }) => accountingApi.updateBankAccount(id, data),
    onSuccess: () => { toast.success('Bank account updated'); qc.invalidateQueries({ queryKey: ['accounting-banks'] }); setEditBank(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function openEditBank(b: BankAccount) {
    setEditBank(b)
    editBankForm.reset({ bankName: b.bankName, accountName: b.accountName, accountNumber: b.accountNumber, currency: b.currency })
  }

  const billForm = useForm<BillForm>({ resolver: zodResolver(billSchema) })
  const createBillMutation = useMutation({
    mutationFn: accountingApi.createBill,
    onSuccess: () => { toast.success('Bill created'); qc.invalidateQueries({ queryKey: ['accounting-bills'] }); setShowNewBill(false); billForm.reset() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const approveBillMutation = useMutation({
    mutationFn: accountingApi.approveBill,
    onSuccess: () => { toast.success('Bill approved'); qc.invalidateQueries({ queryKey: ['accounting-bills'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const today = new Date().toISOString().slice(0, 10)

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: 'BANK_TRANSFER', paymentDate: today },
  })

  function openPayModal(bill: any) {
    setPayingBill(bill)
    paymentForm.reset({
      amount: bill.totalAmount - (bill.paidAmount ?? 0),
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: today,
      reference: bill.billNumber,
    })
    setShowPayBill(true)
  }

  const recordBillPaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentForm }) =>
      accountingApi.recordBillPayment(id, data),
    onSuccess: () => {
      toast.success('Payment recorded — GL entry posted (Dr AP / Cr Cash)')
      qc.invalidateQueries({ queryKey: ['accounting-bills'] })
      setShowPayBill(false)
      setPayingBill(null)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  function handleExportCsv() {
    accountingApi.exportJournalEntriesCsv(divisionFilter || undefined).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data as any], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'journal-entries.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    }).catch(() => toast.error('Failed to export CSV'))
  }

  const seedMutation = useMutation({
    mutationFn: accountingApi.seedDefaultAccounts,
    onSuccess: () => { toast.success('Default accounts seeded'); qc.invalidateQueries({ queryKey: ['accounting-coa'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const recalcMutation = useMutation({
    mutationFn: accountingApi.recalculateBalances,
    onSuccess: (r) => { toast.success(r.data.message ?? 'Balances recalculated'); qc.invalidateQueries({ queryKey: ['accounting-coa'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const journalForm = useForm<JournalForm>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      entryDate: today,
      lines: [
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
      ],
    },
  })
  const { fields: journalLines, append: appendLine, remove: removeLine } = useFieldArray({
    control: journalForm.control, name: 'lines',
  })
  const watchedLines = journalForm.watch('lines')
  const totalDebits  = watchedLines.reduce((s, l) => s + (Number(l.debitAmount) || 0), 0)
  const totalCredits = watchedLines.reduce((s, l) => s + (Number(l.creditAmount) || 0), 0)
  const isBalanced   = Math.abs(totalDebits - totalCredits) < 0.01

  const createJournalMutation = useMutation({
    mutationFn: (data: JournalForm) => accountingApi.createJournalEntry({
      description: data.description,
      entryDate:   data.entryDate,
      reference:   data.reference || undefined,
      lines: data.lines.map((l) => ({
        accountId:    l.accountId,
        description:  l.description || undefined,
        debitAmount:  l.debitAmount,
        creditAmount: l.creditAmount,
      })),
    }),
    onSuccess: () => {
      toast.success('Journal entry created')
      qc.invalidateQueries({ queryKey: ['accounting-journals'] })
      qc.invalidateQueries({ queryKey: ['accounting-coa'] })
      setShowNewJournal(false)
      journalForm.reset({ entryDate: today, lines: [
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
      ]})
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const billStatusBadge = (s: string) =>
    s === 'PAID' ? 'green' : s === 'PARTIALLY_PAID' ? 'amber' : s === 'PENDING' ? 'blue' : 'gray'

  if (isTenantUser()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen size={52} className="mb-4 text-gray-200" />
        <p className="text-[16px] font-semibold text-gray-500">Access Restricted</p>
        <p className="text-[13px] text-gray-400 mt-1">Your role does not have permission to view accounting data.</p>
      </div>
    )
  }

  const divisionList = Array.isArray(divisions) ? divisions : []

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets',   value: formatCurrency(assetTotal),    icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50',  sub: `${accs.filter((a) => a.accountType === 'ASSET').length} accounts` },
          { label: 'Net Income',     value: formatCurrency(netIncome),      icon: DollarSign,  color: netIncome >= 0 ? 'text-green-600' : 'text-red-500', bg: netIncome >= 0 ? 'bg-green-50' : 'bg-red-50', sub: `Rev ${formatCurrency(revenueTotal)} − Exp ${formatCurrency(expenseTotal)}` },
          { label: 'Bank Balance',   value: formatCurrency(totalBankBalance), icon: Building2, color: 'text-blue-500',   bg: 'bg-blue-50',   sub: `${bankList.length} account${bankList.length !== 1 ? 's' : ''}` },
          { label: 'Pending Bills',  value: formatCurrency(totalPendingBills), icon: Receipt,  color: totalPendingBills > 0 ? 'text-amber-500' : 'text-gray-400', bg: 'bg-amber-50', sub: `${pendingBills.length} unpaid bill${pendingBills.length !== 1 ? 's' : ''}` },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[12px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
              <div className={cn('w-8 h-8 rounded-[8px] flex items-center justify-center', bg)}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className="text-[20px] font-extrabold text-gray-900 leading-tight">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Division filter (TENANT_ADMIN only) ── */}
      {isTenantAdmin() && (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[10px] px-4 py-2.5 shadow-sm w-fit">
          <Filter size={13} className="text-green-600 flex-shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">View:</span>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="text-[13px] border-0 bg-transparent text-gray-700 font-semibold focus:outline-none focus:ring-0 pr-2 cursor-pointer"
          >
            <option value="">All Divisions (Root)</option>
            {divisionList.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {divisionFilter && (
            <button
              onClick={() => setDivisionFilter('')}
              className="text-[11px] text-gray-400 hover:text-red-400 font-medium transition-colors ml-1"
            >
              ✕ Clear
            </button>
          )}
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
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Account type breakdown */}
          <Card>
            <CardHeader title="Balance by Account Type" />
            <div className="p-5 space-y-4">
              {[
                { type: 'ASSET',     label: 'Assets',      value: assetTotal,     color: 'bg-green-500', max: Math.max(assetTotal, liabilityTotal, revenueTotal, expenseTotal) },
                { type: 'LIABILITY', label: 'Liabilities', value: liabilityTotal, color: 'bg-red-400',   max: Math.max(assetTotal, liabilityTotal, revenueTotal, expenseTotal) },
                { type: 'REVENUE',   label: 'Revenue',     value: revenueTotal,   color: 'bg-amber-400', max: Math.max(assetTotal, liabilityTotal, revenueTotal, expenseTotal) },
                { type: 'EXPENSE',   label: 'Expenses',    value: expenseTotal,   color: 'bg-gray-400',  max: Math.max(assetTotal, liabilityTotal, revenueTotal, expenseTotal) },
                { type: 'EQUITY',    label: 'Equity',      value: assetTotal - liabilityTotal, color: 'bg-blue-400', max: Math.max(assetTotal, liabilityTotal, revenueTotal, expenseTotal) },
              ].map(({ type, label, value, color, max }) => (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10.5px] font-bold px-2 py-0.5 rounded-full', accountTypeColors[type as AccountType])}>{type}</span>
                      <span className="text-[12.5px] text-gray-500">{label}</span>
                    </div>
                    <span className={cn('text-[13px] font-bold', value < 0 ? 'text-red-600' : 'text-gray-800')}>{formatCurrency(value)}</span>
                  </div>
                  <MiniBar value={Math.abs(value)} max={max} color={color} />
                </div>
              ))}
            </div>
          </Card>

          {/* Bank accounts */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Bank Accounts</h3>
              <button onClick={() => setTab('banks')} className="text-[12px] font-semibold text-green-600 hover:text-green-700">
                Manage →
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {bankList.length === 0 ? (
                <div className="p-5"><EmptyState message="No bank accounts linked yet" /></div>
              ) : bankList.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-blue-50 flex items-center justify-center">
                      <Building2 size={14} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-gray-800">{b.accountName}</p>
                      <p className="text-[11.5px] text-gray-400">{b.bankName} · ···{b.accountNumber.slice(-4)}</p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-gray-900">{formatCurrency(b.balance ?? 0, b.currency)}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent bills */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Recent Bills</h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {formatCurrency(totalPendingBills)} pending
                </span>
                <button onClick={() => setTab('bills')} className="text-[12px] font-semibold text-green-600 hover:text-green-700">View all →</button>
              </div>
            </div>
            <Table>
              <Thead><Th>Bill #</Th><Th>Vendor</Th><Th>Amount</Th><Th>Due Date</Th><Th>Status</Th><Th>Actions</Th></Thead>
              <Tbody>
                {billList.slice(0, 5).length === 0 ? <EmptyState message="No bills yet" /> : billList.slice(0, 5).map((b) => (
                  <Tr key={b.id}>
                    <Td><span className="font-mono font-semibold text-gray-600">{b.billNumber}</span></Td>
                    <Td className="font-semibold">{b.vendorName}</Td>
                    <Td className="font-bold">{formatCurrency(b.totalAmount)}</Td>
                    <Td className="text-gray-500">{formatDate(b.dueDate)}</Td>
                    <Td><Badge variant={billStatusBadge(b.status) as any}>{b.status}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        {b.status === 'DRAFT' && <button onClick={() => approveBillMutation.mutate(b.id)} className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full">Approve</button>}
                        {(b.status === 'PENDING' || b.status === 'PARTIALLY_PAID') && <button onClick={() => openPayModal(b)} className="text-[11px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} />Pay</button>}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ══ CHART OF ACCOUNTS TAB ══ */}
      {tab === 'accounts' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Chart of Accounts</h3>
              <p className="text-[11.5px] text-gray-400 mt-0.5">Standard Nigeria/IFRS accounts — seed once per company</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" loading={recalcMutation.isPending} onClick={() => recalcMutation.mutate(undefined)} title="Reset all balances to zero and replay every posted journal entry. Run once if balances look wrong.">Recalculate Balances</Button>
              <Button variant="outline" loading={seedMutation.isPending} onClick={() => seedMutation.mutate(undefined)}>Seed Defaults</Button>
              <Button icon={<Plus size={14} />} onClick={() => setShowNewAccount(true)}>Add Account</Button>
            </div>
          </div>
          <Table>
            <Thead><Th>Code</Th><Th>Name</Th><Th>Type</Th><Th>Description</Th><Th>Balance</Th><Th>Status</Th></Thead>
            <Tbody>
              {coaLoading ? <SkeletonRows cols={6} /> : accs.length === 0 ? (
                <EmptyState message="No accounts yet. Add your chart of accounts to start recording financial transactions." icon={<BookOpen size={28} />} />
              ) : accs.map((acc) => (
                <Tr key={acc.id}>
                  <Td><span className="font-mono font-bold text-gray-600">{acc.code}</span></Td>
                  <Td className="font-semibold">{acc.name}</Td>
                  <Td><span className={cn('text-[10.5px] font-bold px-2 py-0.5 rounded-full', accountTypeColors[acc.accountType])}>{acc.accountType}</span></Td>
                  <Td className="text-gray-500 text-[12.5px]">{acc.description ?? '—'}</Td>
                  <Td className={cn('font-bold', (acc.balance ?? 0) < 0 ? 'text-red-600' : 'text-gray-800')}>{formatCurrency(acc.balance ?? 0)}</Td>
                  <Td><Badge variant={acc.isActive ? 'green' : 'gray'}>{acc.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ JOURNALS TAB ══ */}
      {tab === 'journals' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Journal Entries</h3>
              <p className="text-[11.5px] text-gray-400 mt-0.5">Post transport, telephone, levies, and any other transactions here</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" icon={<Download size={14} />} onClick={handleExportCsv}>Export CSV</Button>
              <Button icon={<Plus size={14} />} onClick={() => setShowNewJournal(true)}>New Entry</Button>
            </div>
          </div>
          <Table>
            <Thead><Th>Entry #</Th><Th>Description</Th><Th>Total Debit</Th><Th>Total Credit</Th><Th>Balanced</Th><Th>Status</Th><Th>Date</Th></Thead>
            <Tbody>
              {journalLoading ? <SkeletonRows cols={7} /> : (journals?.content ?? []).length === 0 ? (
                <EmptyState message="No journal entries yet." icon={<FileText size={28} />} />
              ) : (journals?.content ?? []).map((je) => {
                const balanced = Math.abs((je.totalDebit ?? 0) - (je.totalCredit ?? 0)) < 0.01
                return (
                  <Tr key={je.id}>
                    <Td><span className="font-mono font-semibold text-gray-600">{je.entryNumber}</span></Td>
                    <Td>{je.description}</Td>
                    <Td className="font-bold text-green-700">{formatCurrency(je.totalDebit ?? 0)}</Td>
                    <Td className="font-bold text-red-600">{formatCurrency(je.totalCredit ?? 0)}</Td>
                    <Td>
                      {balanced
                        ? <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><CheckCircle2 size={10} />Balanced</span>
                        : <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full w-fit">Unbalanced</span>}
                    </Td>
                    <Td><Badge variant={je.status === 'POSTED' ? 'green' : 'gray'}>{je.status}</Badge></Td>
                    <Td className="text-gray-400">{formatDate(je.createdAt)}</Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ BILLS TAB ══ */}
      {tab === 'bills' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Bills — Accounts Payable</h3>
              {totalPendingBills > 0 && (
                <p className="text-[12px] text-amber-600 mt-0.5">{formatCurrency(totalPendingBills)} across {pendingBills.length} pending bill{pendingBills.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewBill(true)}>New Bill</Button>
          </div>
          <Table>
            <Thead><Th>Bill #</Th><Th>Vendor</Th><Th>Amount</Th><Th>Due Date</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></Thead>
            <Tbody>
              {billsLoading ? <SkeletonRows cols={7} /> : billList.length === 0 ? (
                <EmptyState message="No bills yet. Create bills to track what you owe suppliers." icon={<Receipt size={28} />} />
              ) : billList.map((b) => {
                const overdue = new Date(b.dueDate) < new Date() && b.status !== 'PAID'
                return (
                  <Tr key={b.id} className={overdue ? 'bg-red-50/30' : ''}>
                    <Td><span className="font-mono font-semibold text-gray-600">{b.billNumber}</span></Td>
                    <Td className="font-semibold">{b.vendorName}</Td>
                    <Td className="font-bold">{formatCurrency(b.totalAmount)}</Td>
                    <Td className={cn('font-medium', overdue ? 'text-red-600' : 'text-gray-500')}>{formatDate(b.dueDate)}{overdue && ' (Overdue)'}</Td>
                    <Td><Badge variant={billStatusBadge(b.status) as any}>{b.status}</Badge></Td>
                    <Td className="text-gray-400">{formatDate(b.createdAt)}</Td>
                    <Td>
                      <div className="flex gap-1">
                        {b.status === 'DRAFT' && <button onClick={() => approveBillMutation.mutate(b.id)} className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors">Approve</button>}
                        {(b.status === 'PENDING' || b.status === 'PARTIALLY_PAID') && <button onClick={() => openPayModal(b)} className="text-[11px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"><CheckCircle2 size={10} />Pay</button>}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ BANK ACCOUNTS TAB ══ */}
      {tab === 'banks' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Bank Accounts</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Total balance: {formatCurrency(totalBankBalance)}</p>
            </div>
            <Button icon={<Plus size={14} />} onClick={() => setShowNewBank(true)}>Add Bank Account</Button>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banksLoading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)
            ) : bankList.length === 0 ? (
              <div className="col-span-3"><EmptyState message="No bank accounts yet. Link your company bank accounts to track cash flow." icon={<Building2 size={28} />} /></div>
            ) : bankList.map((b) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-green-200 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-[14px] text-gray-900">{b.accountName}</p>
                      <p className="text-[12px] text-gray-500">{b.bankName}</p>
                    </div>
                  </div>
                  <button onClick={() => openEditBank(b)} className="w-7 h-7 rounded-[6px] bg-gray-100 hover:bg-green-50 hover:text-green-600 flex items-center justify-center text-gray-400 transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={12} /></button>
                </div>
                <div className="mt-4">
                  <p className="text-[22px] font-extrabold text-gray-900">{formatCurrency(b.balance ?? 0, b.currency)}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5 font-mono">···· ···· ···· {b.accountNumber.slice(-4)}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={b.isActive ? 'green' : 'gray'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
                  <span className="text-[11.5px] text-gray-400">{b.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ══ REPORTS TAB ══ */}
      {tab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* P&L Summary */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-[15px] font-bold text-gray-900">Profit & Loss</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">From chart of accounts balances</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-green-500" /><span className="text-[13px] text-gray-600">Total Revenue</span></div>
                  <span className="text-[14px] font-bold text-green-700">{formatCurrency(revenueTotal)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2"><ArrowDownLeft size={14} className="text-red-400" /><span className="text-[13px] text-gray-600">Total Expenses</span></div>
                  <span className="text-[14px] font-bold text-red-600">{formatCurrency(expenseTotal)}</span>
                </div>
                <div className={cn('flex items-center justify-between py-3 px-4 rounded-[8px]', netIncome >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
                  <span className="text-[13.5px] font-bold text-gray-800">Net Income</span>
                  <span className={cn('text-[17px] font-extrabold', netIncome >= 0 ? 'text-green-700' : 'text-red-600')}>{formatCurrency(netIncome)}</span>
                </div>
              </div>
            </div>

            {/* Balance Sheet summary */}
            <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[15px] font-bold text-gray-900">Balance Sheet Summary</h3>
              </div>
              <div className="p-5 space-y-2">
                {[
                  { label: 'Total Assets',     value: assetTotal,                    color: 'text-green-700' },
                  { label: 'Total Liabilities',value: liabilityTotal,                color: 'text-red-600'   },
                  { label: 'Net Worth (Equity)',value: assetTotal - liabilityTotal,   color: assetTotal - liabilityTotal >= 0 ? 'text-green-700' : 'text-red-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[13px] text-gray-600">{label}</span>
                    <span className={cn('text-[14px] font-bold', color)}>{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trial Balance */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Trial Balance</h3>
            </div>
            <div className="p-5">
              {tbLoading ? (
                <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : !trialBalance ? (
                <EmptyState message="No trial balance data available" />
              ) : (
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-semibold">Account</th>
                      <th className="text-right py-2 text-gray-500 font-semibold">Debit</th>
                      <th className="text-right py-2 text-gray-500 font-semibold">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(trialBalance.accounts ?? []).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2 text-gray-700">{row.accountName}</td>
                        <td className="py-2 text-right font-medium text-green-700">{row.debit ? formatCurrency(row.debit) : '—'}</td>
                        <td className="py-2 text-right font-medium text-red-600">{row.credit ? formatCurrency(row.credit) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300">
                    <tr>
                      <td className="py-2.5 font-bold text-gray-800">Totals</td>
                      <td className="py-2.5 text-right font-bold text-green-700">{formatCurrency(trialBalance.totalDebit ?? 0)}</td>
                      <td className="py-2.5 text-right font-bold text-red-600">{formatCurrency(trialBalance.totalCredit ?? 0)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="pt-1">
                        {Math.abs((trialBalance.totalDebit ?? 0) - (trialBalance.totalCredit ?? 0)) < 0.01 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Balanced
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Out of balance by {formatCurrency(Math.abs((trialBalance.totalDebit ?? 0) - (trialBalance.totalCredit ?? 0)))}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* New Account */}
      <Modal open={showNewAccount} onClose={() => { setShowNewAccount(false); accountForm.reset() }} title="Add Account" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowNewAccount(false)}>Cancel</Button><Button loading={createAccountMutation.isPending} onClick={accountForm.handleSubmit((v) => createAccountMutation.mutate(v))}>Save Account</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Code" required {...accountForm.register('code')} error={accountForm.formState.errors.code?.message} placeholder="1001" hint="Unique numeric code — e.g. 1001 for Cash" />
            <Select label="Account Type" required {...accountForm.register('accountType')} hint="How this account is classified in financial statements">
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </Select>
          </div>
          <Input label="Account Name" required {...accountForm.register('name')} error={accountForm.formState.errors.name?.message} placeholder="Cash at Bank" className="col-span-2" hint="Descriptive name for this account" />
          <Input label="Description" {...accountForm.register('description')} placeholder="Optional notes about this account" hint="Additional context about what this account tracks" />
        </div>
      </Modal>

      {/* New Bank Account */}
      <Modal open={showNewBank} onClose={() => { setShowNewBank(false); bankForm.reset() }} title="Add Bank Account" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowNewBank(false)}>Cancel</Button><Button loading={createBankMutation.isPending} onClick={bankForm.handleSubmit((v) => createBankMutation.mutate(v))}>Save Account</Button></>}>
        <div className="space-y-4">
          <Input label="Bank Name" required {...bankForm.register('bankName')} error={bankForm.formState.errors.bankName?.message} placeholder="Zenith Bank" hint="Name of the bank or financial institution" />
          <Input label="Account Name" required {...bankForm.register('accountName')} error={bankForm.formState.errors.accountName?.message} placeholder="WaysERP Business Account" hint="Name on the bank account" />
          <Input label="Account Number" required {...bankForm.register('accountNumber')} error={bankForm.formState.errors.accountNumber?.message} placeholder="0123456789" hint="10-digit NUBAN account number" />
          <Select label="Currency" {...bankForm.register('currency')} hint="Account currency">
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
          </Select>
        </div>
      </Modal>

      {/* Edit Bank Account */}
      <Modal open={!!editBank} onClose={() => setEditBank(null)} title={`Edit — ${editBank?.accountName}`} size="sm"
        footer={<><Button variant="outline" onClick={() => setEditBank(null)}>Cancel</Button><Button loading={updateBankMutation.isPending} onClick={editBankForm.handleSubmit((v) => updateBankMutation.mutate({ id: editBank!.id, data: v }))}>Save Changes</Button></>}>
        <div className="space-y-4">
          <Input label="Bank Name" required {...editBankForm.register('bankName')} hint="Name of the bank" />
          <Input label="Account Name" required {...editBankForm.register('accountName')} hint="Name on the account" />
          <Input label="Account Number" required {...editBankForm.register('accountNumber')} hint="Bank account number" />
          <Select label="Currency" {...editBankForm.register('currency')} hint="Account currency">
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
          </Select>
        </div>
      </Modal>

      {/* New Journal Entry */}
      <Modal
        open={showNewJournal}
        onClose={() => { setShowNewJournal(false); journalForm.reset({ entryDate: today, lines: [{ accountId: '', description: '', debitAmount: 0, creditAmount: 0 }, { accountId: '', description: '', debitAmount: 0, creditAmount: 0 }] }) }}
        title="New Journal Entry"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewJournal(false)}>Cancel</Button>
            <Button
              loading={createJournalMutation.isPending}
              disabled={!isBalanced}
              onClick={journalForm.handleSubmit((v) => createJournalMutation.mutate(v))}
            >
              {isBalanced ? 'Post Entry' : `Out of balance by ${Math.abs(totalDebits - totalCredits).toFixed(2)}`}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-[8px] p-3 text-[12.5px] text-blue-700">
            Use this to record any business expense — transport, telephone bills, levies, salaries, or any other transaction not captured automatically.
          </div>

          {/* Header fields */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Description" required
              {...journalForm.register('description')}
              error={journalForm.formState.errors.description?.message}
              placeholder="e.g. Transport to client site"
              hint="What this journal entry records"
              className="col-span-2"
            />
            <Input
              label="Entry Date" required type="date"
              {...journalForm.register('entryDate')}
              error={journalForm.formState.errors.entryDate?.message}
            />
          </div>
          <Input
            label="Reference / Memo"
            {...journalForm.register('reference')}
            placeholder="Receipt #, cheque #, or any reference"
            hint="Optional — for audit trail"
          />

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Lines — Debit and Credit must balance</p>
              <button
                type="button"
                onClick={() => appendLine({ accountId: '', description: '', debitAmount: 0, creditAmount: 0 })}
                className="flex items-center gap-1 text-[12px] font-semibold text-green-600 hover:text-green-700"
              >
                <Plus size={13} /> Add line
              </button>
            </div>

            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr_24px] gap-2 px-1">
                {['Account', 'Description', 'Debit (Dr)', 'Credit (Cr)', ''].map((h) => (
                  <p key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{h}</p>
                ))}
              </div>

              {journalLines.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_24px] gap-2 items-center">
                  <Select
                    {...journalForm.register(`lines.${i}.accountId`)}
                    error={journalForm.formState.errors.lines?.[i]?.accountId?.message}
                  >
                    <option value="">— Account —</option>
                    {accs.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                    ))}
                  </Select>
                  <Input
                    {...journalForm.register(`lines.${i}.description`)}
                    placeholder="Line description"
                  />
                  <Input
                    type="number" step="0.01" placeholder="0.00"
                    {...journalForm.register(`lines.${i}.debitAmount`)}
                  />
                  <Input
                    type="number" step="0.01" placeholder="0.00"
                    {...journalForm.register(`lines.${i}.creditAmount`)}
                  />
                  {journalLines.length > 2 ? (
                    <button type="button" onClick={() => removeLine(i)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  ) : <div />}
                </div>
              ))}
            </div>

            {/* Totals row */}
            <div className={cn('mt-3 flex items-center justify-end gap-6 text-[13px] font-semibold px-4 py-2.5 rounded-[8px]', isBalanced ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
              <span>Total Debit: <strong>{totalDebits.toFixed(2)}</strong></span>
              <span>Total Credit: <strong>{totalCredits.toFixed(2)}</strong></span>
              {isBalanced
                ? <span className="flex items-center gap-1"><CheckCircle2 size={13} /> Balanced</span>
                : <span>Difference: {Math.abs(totalDebits - totalCredits).toFixed(2)}</span>}
            </div>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        open={showPayBill}
        onClose={() => { setShowPayBill(false); setPayingBill(null); paymentForm.reset() }}
        title={payingBill ? `Record Payment — ${payingBill.billNumber}` : 'Record Payment'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowPayBill(false); setPayingBill(null) }}>Cancel</Button>
            <Button
              loading={recordBillPaymentMutation.isPending}
              onClick={paymentForm.handleSubmit((v) => {
              const remaining = (payingBill.totalAmount ?? 0) - (payingBill.paidAmount ?? 0)
              if (v.amount > remaining + 0.01) {
                paymentForm.setError('amount', {
                  message: `Cannot exceed remaining balance of ${formatCurrency(remaining)}`,
                })
                return
              }
              recordBillPaymentMutation.mutate({ id: payingBill!.id, data: v })
            })}
            >
              Record Payment
            </Button>
          </>
        }
      >
        {payingBill && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-[8px] p-3 text-[12.5px] text-amber-700 space-y-1">
              <p><span className="font-semibold">Vendor:</span> {payingBill.vendorName}</p>
              <p><span className="font-semibold">Total:</span> {formatCurrency(payingBill.totalAmount)} &nbsp;·&nbsp; <span className="font-semibold">Paid:</span> {formatCurrency(payingBill.paidAmount ?? 0)} &nbsp;·&nbsp; <span className="font-semibold">Balance:</span> {formatCurrency(payingBill.totalAmount - (payingBill.paidAmount ?? 0))}</p>
            </div>
            <Input
              label="Amount (₦)" required type="number" step="0.01"
              {...paymentForm.register('amount')}
              error={paymentForm.formState.errors.amount?.message}
              hint="Leave as-is to pay the remaining balance in full"
            />
            <Select label="Payment Method" required {...paymentForm.register('paymentMethod')}>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="CHEQUE">Cheque</option>
            </Select>
            <Input
              label="Payment Date" required type="date"
              {...paymentForm.register('paymentDate')}
              error={paymentForm.formState.errors.paymentDate?.message}
            />
            <Input
              label="Reference / Transaction ID"
              {...paymentForm.register('reference')}
              placeholder="e.g. TRF-20240501-001"
              hint="Bank reference, cheque number, or transaction ID"
            />
            <Input
              label="Notes"
              {...paymentForm.register('notes')}
              placeholder="Optional payment note"
            />
          </div>
        )}
      </Modal>

      {/* New Bill */}
      <Modal open={showNewBill} onClose={() => { setShowNewBill(false); billForm.reset() }} title="New Bill" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowNewBill(false)}>Cancel</Button><Button loading={createBillMutation.isPending} onClick={billForm.handleSubmit((v) => createBillMutation.mutate(v))}>Create Bill</Button></>}>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-[8px] p-3 text-[12.5px] text-blue-700">
            Bills represent amounts you owe to suppliers. Approve and mark paid when payment is made.
          </div>
          <Input label="Vendor / Supplier Name" required {...billForm.register('vendorName')} error={billForm.formState.errors.vendorName?.message} hint="Name of the supplier or vendor sending this bill" />
          <Input label="Bill Number / Reference" required {...billForm.register('billNumber')} error={billForm.formState.errors.billNumber?.message} placeholder="INV-2024-001" hint="Supplier's invoice or bill number" />
          <Input label="Amount (₦)" required type="number" step="0.01" {...billForm.register('totalAmount')} error={billForm.formState.errors.totalAmount?.message} hint="Total amount owed on this bill" />
          <Input label="Due Date" required type="date" {...billForm.register('dueDate')} error={billForm.formState.errors.dueDate?.message} hint="Date payment is due to the supplier" />
        </div>
      </Modal>
    </div>
  )
}