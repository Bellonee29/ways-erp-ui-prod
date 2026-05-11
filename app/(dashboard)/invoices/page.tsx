'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Zap, Trash2, FileText, FileMinus, FilePlus, Eye, RotateCcw, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { invoicesApi } from '@/lib/api/invoices'
import { useAuthStore } from '@/store/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api/client'
import Button from '@/components/ui/Button'
import Badge, { invoiceStatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState, SkeletonRows } from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import Input, { Select } from '@/components/ui/Input'
import NewInvoiceModal from '@/components/invoices/NewInvoiceModal'
import InvoicePreviewModal from '@/components/invoices/InvoicePreviewModal'
import InvoiceUploadModal from '@/components/invoices/InvoiceUploadModal'
import type { Invoice } from '@/types'

/* ── Credit/Debit note schema ── */
const noteItemSchema = z.object({
  description: z.string().min(1, 'Required'),
  quantity:    z.coerce.number().positive('Must be > 0'),
  unitPrice:   z.coerce.number().positive('Must be > 0'),
  taxRate:     z.coerce.number().min(0).default(7.5),
})

const noteSchema = z.object({
  noteType:  z.enum(['CREDIT', 'DEBIT']),
  issueDate: z.string().min(1, 'Required'),
  reason:    z.string().min(1, 'Reason is required'),
  notes:     z.string().optional(),
  items:     z.array(noteItemSchema).min(1, 'Add at least one item'),
})
type NoteForm = z.infer<typeof noteSchema>

const today = new Date().toISOString().slice(0, 10)

function parseFirsError(raw: string): { stage: string; detail: string; publicMessage: string } {
  try {
    const jsonStart = raw.indexOf('{')
    if (jsonStart === -1) return { stage: '', detail: raw, publicMessage: '' }
    const obj = JSON.parse(raw.slice(jsonStart))
    const err = obj?.message?.error ?? obj?.error ?? {}
    return {
      stage:         err.handler ?? '',
      detail:        err.details ?? obj?.message?.message ?? raw,
      publicMessage: err.public_message ?? '',
    }
  } catch {
    return { stage: '', detail: raw, publicMessage: '' }
  }
}

function FiscalizationErrorBody({ invoiceNumber, error }: { invoiceNumber: string; error: string }) {
  const { stage, detail, publicMessage } = parseFirsError(error)
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-[10px] p-4">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-red-600 text-[16px] font-bold">✕</span>
        </div>
        <div>
          <p className="text-[13.5px] font-bold text-red-800">Invoice {invoiceNumber} could not be fiscalized</p>
          <p className="text-[12px] text-red-500 mt-0.5">FIRS rejected the invoice during validation</p>
        </div>
      </div>

      <div className="space-y-3">
        {stage && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Stage</p>
            <p className="text-[13px] text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-[6px] border border-gray-200">{stage.replace(/_/g, ' ')}</p>
          </div>
        )}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">FIRS Error Detail</p>
          <p className="text-[13px] text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-[6px] leading-relaxed">{detail}</p>
        </div>
        {publicMessage && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Public Message</p>
            <p className="text-[13px] text-gray-600 italic">{publicMessage}</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2.5 text-[12.5px] text-amber-700">
        <strong>What to do:</strong> Check that all line items have a valid VAT type (STANDARD_VAT, ZERO_VAT, or EXEMPT), the customer TIN is correct, and there are no duplicate invoice numbers before retrying.
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const { isTenantAdmin } = useAuthStore()
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  const fromSoId       = searchParams.get('fromSo') ?? undefined
  const fromSoCustomer = searchParams.get('customer') ?? undefined

  useEffect(() => {
    if (fromSoId) setShowNew(true)
  }, [fromSoId])
  const [noteInvoice, setNoteInvoice] = useState<Invoice | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [fiscalError, setFiscalError] = useState<{ invoiceNumber: string; error: string } | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { page, admin: isTenantAdmin() }],
    queryFn: () =>
      (isTenantAdmin() ? invoicesApi.getAllInvoices : invoicesApi.getMyInvoices)({ page, size: 15 })
        .then((r) => r.data.data),
  })

  const fiscalizeMutation = useMutation({
    mutationFn: invoicesApi.fiscalize,
    onSuccess: (res) => {
      const result = res.data.data
      qc.invalidateQueries({ queryKey: ['invoices'] })
      if (result.success) {
        toast.success(`Invoice ${result.invoiceNumber} fiscalized successfully`)
      } else {
        setFiscalError({ invoiceNumber: result.invoiceNumber, error: result.error ?? result.message })
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: invoicesApi.delete,
    onSuccess: () => {
      toast.success('Invoice deleted')
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  async function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadReceipt(inv: Invoice) {
    try {
      const res = await invoicesApi.getReceiptByInvoice(inv.id)
      await downloadFile(new Blob([res.data], { type: 'application/pdf' }), `receipt-${inv.invoiceNumber}.pdf`)
    } catch {
      toast.error('Receipt not yet available for this invoice')
    }
  }

  async function downloadInvoicePdf(inv: Invoice) {
    try {
      const res = await invoicesApi.downloadInvoice(inv.id)
      await downloadFile(new Blob([res.data], { type: 'application/pdf' }), `invoice-${inv.invoiceNumber}.pdf`)
    } catch {
      toast.error('Failed to download invoice PDF')
    }
  }

  const filtered = (data?.content ?? []).filter(
    (inv) =>
      !search ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  )

  const invoices  = data?.content ?? []
  const selectableInvoices = filtered.filter((i) => i.status === 'DRAFT' || i.fiscalizationStatus === 'FAILED')
  const draftInvoices = filtered.filter((i) => i.status === 'DRAFT')
  const allDraftsSelected = selectableInvoices.length > 0 && selectableInvoices.every((i) => selected.has(i.id))
  const selectedDraftCount = Array.from(selected).filter((id) => invoices.find((i) => i.id === id && i.status === 'DRAFT' && i.fiscalizationStatus !== 'FAILED')).length
  const selectedFailedCount = Array.from(selected).filter((id) => invoices.find((i) => i.id === id && i.fiscalizationStatus === 'FAILED')).length
  const totalFiscalized = invoices.filter((i) => i.status === 'FISCALIZED').length
  const totalDraft      = invoices.filter((i) => i.status === 'DRAFT').length
  const totalValue      = invoices.reduce((s, i) => s + i.totalAmount, 0)
  const totalPaid       = invoices.filter((i) => i.invoicePaymentStatus === 'PAID').reduce((s, i) => s + i.totalAmount, 0)
  const totalPending    = invoices.filter((i) => i.invoicePaymentStatus === 'PENDING').reduce((s, i) => s + i.totalAmount, 0)
  const totalTax        = invoices.reduce((s, i) => s + (i.taxAmount ?? 0), 0)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allDraftsSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectableInvoices.map((i) => i.id)))
    }
  }

  async function bulkFiscalize() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setBulkProcessing(true)
    let successCount = 0
    let failCount = 0
    for (const id of ids) {
      try {
        await invoicesApi.fiscalize(id)
        successCount++
      } catch {
        failCount++
      }
    }
    setBulkProcessing(false)
    setSelected(new Set())
    qc.invalidateQueries({ queryKey: ['invoices'] })
    if (failCount === 0) {
      toast.success(`${successCount} invoice${successCount !== 1 ? 's' : ''} fiscalized successfully`)
    } else {
      toast.error(`${successCount} succeeded, ${failCount} failed — check individual statuses`)
    }
  }

  /* ── Credit/Debit note form ── */
  const noteForm = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      noteType: 'CREDIT',
      issueDate: today,
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 7.5 }],
    },
  })
  const { fields: noteFields, append: appendNote, remove: removeNote } = useFieldArray({
    control: noteForm.control,
    name: 'items',
  })

  const createNoteMutation = useMutation({
    mutationFn: (data: NoteForm) =>
      invoicesApi.createNote({
        originalInvoiceId: noteInvoice!.id,
        noteType:  data.noteType,
        issueDate: data.issueDate,
        reason:    data.reason,
        notes:     data.notes || undefined,
        items: data.items.map((item) => ({
          description: item.description,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          taxRate:     item.taxRate,
        })),
      }),
    onSuccess: () => {
      toast.success(`${noteForm.getValues('noteType') === 'CREDIT' ? 'Credit' : 'Debit'} note created`)
      setNoteInvoice(null)
      noteForm.reset()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Summary stats — row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
        {[
          { label: 'Total Invoices', value: data?.totalElements ?? 0,  cls: 'text-gray-900'   },
          { label: 'Fiscalized',     value: totalFiscalized,            cls: 'text-green-700'  },
          { label: 'Drafts',         value: totalDraft,                 cls: 'text-amber-700'  },
          { label: 'Total Value',    value: formatCurrency(totalValue), cls: 'text-gray-900'   },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[10px] shadow-sm p-[16px] min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.06em] text-gray-500">{label}</p>
            <p className={`text-[15px] font-extrabold mt-1 ${cls}`} title={String(value)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Summary stats — row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
        {[
          { label: 'Total Paid',    value: formatCurrency(totalPaid),    cls: 'text-green-700'  },
          { label: 'Total Pending', value: formatCurrency(totalPending), cls: 'text-amber-700'  },
          { label: 'Total Tax',     value: formatCurrency(totalTax),     cls: 'text-purple-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[10px] shadow-sm p-[16px] min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.06em] text-gray-500">{label}</p>
            <p className={`text-[15px] font-extrabold mt-1 ${cls}`} title={String(value)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <Card>
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-[22px] border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-2 bg-white border-[1.5px] border-gray-200 rounded-[6px] px-[14px] py-2 w-72 focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,.1)] transition-all">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or invoice #..."
              className="border-none outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <Button
                loading={bulkProcessing}
                icon={selectedFailedCount > 0 && selectedDraftCount === 0 ? <RotateCcw size={14} /> : <Zap size={14} />}
                onClick={bulkFiscalize}
                className={selectedFailedCount > 0 && selectedDraftCount === 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {selectedDraftCount > 0 && selectedFailedCount > 0
                  ? `Fiscalize ${selectedDraftCount} + Retry ${selectedFailedCount}`
                  : selectedFailedCount > 0
                  ? `Retry ${selectedFailedCount} Failed`
                  : `Fiscalize ${selectedDraftCount} Selected`}
              </Button>
            )}
            <Button
              icon={<Download size={14} />}
              variant="outline"
              onClick={() => {
                invoicesApi.downloadTemplate().then((res) => {
                  const url = URL.createObjectURL(new Blob([res.data]))
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'invoice-upload-template.xlsx'
                  a.click()
                  URL.revokeObjectURL(url)
                }).catch(() => toast.error('Failed to download template'))
              }}
            >
              Template
            </Button>
            <Button
              icon={<Upload size={14} />}
              variant="outline"
              onClick={() => setShowUpload(true)}
            >
              Upload
            </Button>
            <Button icon={<Plus size={15} />} onClick={() => setShowNew(true)}>
              New Invoice
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <Thead>
            <Th>
              {/* Select-all checkbox — only selects DRAFT invoices */}
              <input
                type="checkbox"
                checked={allDraftsSelected}
                onChange={toggleSelectAll}
                className="w-[14px] h-[14px] accent-green-600 cursor-pointer"
                title="Select all draft invoices"
              />
            </Th>
            <Th>Invoice #</Th>
            <Th>Customer</Th>
            <Th>Date</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>FIRS</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {isLoading ? (
              <SkeletonRows cols={8} rows={8} />
            ) : filtered.length === 0 ? (
              <EmptyState message="No invoices found" icon={<FileText size={32} />} />
            ) : (
              filtered.map((inv) => (
                <Tr key={inv.id} className={selected.has(inv.id) ? 'bg-green-50/50' : ''}>
                  <Td>
                    {(inv.status === 'DRAFT' || inv.fiscalizationStatus === 'FAILED') ? (
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className={`w-[14px] h-[14px] cursor-pointer ${inv.fiscalizationStatus === 'FAILED' ? 'accent-red-600' : 'accent-green-600'}`}
                      />
                    ) : <span />}
                  </Td>
                  <Td><span className="font-mono text-[12.5px] font-semibold text-gray-700">{inv.invoiceNumber}</span></Td>
                  <Td>
                    <div>
                      <p className="font-semibold text-gray-800">{inv.customerName}</p>
                      {inv.customerEmail && <p className="text-[12px] text-gray-400">{inv.customerEmail}</p>}
                    </div>
                  </Td>
                  <Td className="text-gray-500">{formatDate(inv.issueDate ?? inv.createdAt)}</Td>
                  <Td className="font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</Td>
                  <Td><Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge></Td>
                  <Td>
                    {inv.fiscalizationStatus === 'COMPLETED' ? (
                      <Badge shimmer>IRN: {inv.irn?.slice(0, 8)}…</Badge>
                    ) : inv.fiscalizationStatus === 'FAILED' ? (
                      <Badge variant="red">Failed</Badge>
                    ) : (
                      <Badge variant="gray">Not sent</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-[6px]">
                      {/* Fiscalize */}
                      {inv.status === 'DRAFT' && inv.fiscalizationStatus !== 'FAILED' && (
                        <button
                          onClick={() => fiscalizeMutation.mutate(inv.id)}
                          disabled={fiscalizeMutation.isPending}
                          title="Fiscalize"
                          className="w-[30px] h-[30px] rounded-[6px] bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          <Zap size={14} />
                        </button>
                      )}
                      {/* Retry fiscalization after failure */}
                      {inv.fiscalizationStatus === 'FAILED' && (
                        <button
                          onClick={() => fiscalizeMutation.mutate(inv.id)}
                          disabled={fiscalizeMutation.isPending}
                          title="Retry fiscalization"
                          className="w-[30px] h-[30px] rounded-[6px] bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      {/* Credit note */}
                      {(inv.status === 'FISCALIZED' || inv.fiscalizationStatus === 'COMPLETED') && (
                        <button
                          onClick={() => {
                            noteForm.reset({
                              noteType: 'CREDIT',
                              issueDate: today,
                              items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 7.5 }],
                            })
                            setNoteInvoice(inv)
                          }}
                          title="Raise credit note"
                          className="w-[30px] h-[30px] rounded-[6px] bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                        >
                          <FileMinus size={14} />
                        </button>
                      )}
                      {/* Debit note */}
                      {(inv.status === 'FISCALIZED' || inv.fiscalizationStatus === 'COMPLETED') && (
                        <button
                          onClick={() => {
                            noteForm.reset({
                              noteType: 'DEBIT',
                              issueDate: today,
                              items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 7.5 }],
                            })
                            setNoteInvoice(inv)
                          }}
                          title="Raise debit note"
                          className="w-[30px] h-[30px] rounded-[6px] bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors"
                        >
                          <FilePlus size={14} />
                        </button>
                      )}
                      {/* Preview invoice */}
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        title="Preview invoice"
                        className="w-[30px] h-[30px] rounded-[6px] bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      {/* Download invoice PDF (always available) */}
                      <button
                        onClick={() => downloadInvoicePdf(inv)}
                        title="Download invoice PDF"
                        className="w-[30px] h-[30px] rounded-[6px] bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <FileText size={14} />
                      </button>
                      {/* Download receipt (fiscalized only) */}
                      {inv.fiscalizationStatus === 'COMPLETED' && (
                        <button
                          onClick={() => downloadReceipt(inv)}
                          title="Download fiscalized receipt"
                          className="w-[30px] h-[30px] rounded-[6px] bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      {/* Delete draft */}
                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this draft invoice?')) deleteMutation.mutate(inv.id)
                          }}
                          title="Delete"
                          className="w-[30px] h-[30px] rounded-[6px] bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
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

      {/* ── Upload Modal ── */}
      <InvoiceUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => setShowUpload(false)}
      />

      <NewInvoiceModal
        open={showNew}
        onClose={() => {
          setShowNew(false)
          if (fromSoId) router.replace('/invoices')
        }}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['invoices'] })
          if (fromSoId) router.replace('/invoices')
        }}
        salesOrderId={fromSoId}
        initialCustomerName={fromSoCustomer}
      />

      {/* ── Fiscalization Error Modal ── */}
      <Modal
        open={!!fiscalError}
        onClose={() => setFiscalError(null)}
        title="Fiscalization Failed"
        size="md"
        footer={<Button onClick={() => setFiscalError(null)}>Close</Button>}
      >
        {fiscalError && <FiscalizationErrorBody invoiceNumber={fiscalError.invoiceNumber} error={fiscalError.error} />}
      </Modal>

      {/* ── Invoice Preview Modal ── */}
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onFiscalize={() => {
            fiscalizeMutation.mutate(previewInvoice.id)
            setPreviewInvoice(null)
          }}
          onDownload={() => downloadInvoicePdf(previewInvoice)}
          fiscalizing={fiscalizeMutation.isPending}
        />
      )}

      {/* ── Credit / Debit Note Modal ── */}
      <Modal
        open={!!noteInvoice}
        onClose={() => { setNoteInvoice(null); noteForm.reset() }}
        title={`${noteForm.watch('noteType') === 'CREDIT' ? 'Credit' : 'Debit'} Note — ${noteInvoice?.invoiceNumber}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setNoteInvoice(null); noteForm.reset() }}>Cancel</Button>
            <Button
              loading={createNoteMutation.isPending}
              onClick={noteForm.handleSubmit((v) => createNoteMutation.mutate(v))}
            >
              Create {noteForm.watch('noteType') === 'CREDIT' ? 'Credit' : 'Debit'} Note
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3 text-[13px] text-blue-700">
            {noteForm.watch('noteType') === 'CREDIT'
              ? 'A credit note reduces the amount owed — use it to issue refunds or correct overbilling.'
              : 'A debit note increases the amount owed — use it to charge for additional items or underbilling corrections.'}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Note Type"
              hint="Credit = refund/reduction. Debit = additional charge."
              {...noteForm.register('noteType')}
            >
              <option value="CREDIT">Credit Note (Refund / Reduction)</option>
              <option value="DEBIT">Debit Note (Additional Charge)</option>
            </Select>
            <Input
              label="Issue Date" required type="date"
              error={noteForm.formState.errors.issueDate?.message}
              {...noteForm.register('issueDate')}
              hint="Date this note is being issued"
            />
            <Input
              label="Reason" required
              error={noteForm.formState.errors.reason?.message}
              {...noteForm.register('reason')}
              placeholder="e.g. Goods returned, Price correction"
              hint="Clear reason for raising this note — required by FIRS"
              className="col-span-2"
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-[.06em] text-gray-500">Items</p>
              <button
                type="button"
                onClick={() => appendNote({ description: '', quantity: 1, unitPrice: 0, taxRate: 7.5 })}
                className="flex items-center gap-1 text-[12px] font-semibold text-green-600 hover:text-green-700"
              >
                <Plus size={13} /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {noteFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[1fr_70px_100px_70px_24px] gap-2 items-end border border-gray-200 rounded-[8px] p-3 bg-gray-50/50">
                  <Input
                    label={i === 0 ? 'Description' : undefined}
                    {...noteForm.register(`items.${i}.description`)}
                    error={noteForm.formState.errors.items?.[i]?.description?.message}
                    placeholder="Item description"
                    hint="What this line item covers"
                  />
                  <Input
                    label={i === 0 ? 'Qty' : undefined}
                    {...noteForm.register(`items.${i}.quantity`)}
                    type="number" step="0.01" placeholder="1"
                    hint="Quantity"
                  />
                  <Input
                    label={i === 0 ? 'Unit Price' : undefined}
                    {...noteForm.register(`items.${i}.unitPrice`)}
                    type="number" step="0.01" placeholder="0.00"
                    hint="Price per unit"
                  />
                  <Input
                    label={i === 0 ? 'VAT %' : undefined}
                    {...noteForm.register(`items.${i}.taxRate`)}
                    type="number" step="0.1" placeholder="7.5"
                    hint="VAT rate"
                  />
                  {noteFields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeNote(i)}
                      className={`w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 ${i === 0 ? 'mt-[22px]' : ''}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : <div />}
                </div>
              ))}
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-[6px]">
              Additional Notes <span className="text-[12px] font-normal text-gray-400">(optional)</span>
            </label>
            <div className="peer">
              <textarea
                {...noteForm.register('notes')}
                rows={2}
                placeholder="Any further details..."
                className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}