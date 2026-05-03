'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileSpreadsheet, X, Download, CheckCircle2, AlertCircle, User, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { invoicesApi, type InvoiceUploadResult } from '@/lib/api/invoices'
import { crmApi } from '@/lib/api/crm'
import { getErrorMessage } from '@/lib/api/client'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Contact } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function InvoiceUploadModal({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<InvoiceUploadResult | null>(null)

  // Contact picker state
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactPicker, setShowContactPicker] = useState(false)

  const { data: contactsData } = useQuery({
    queryKey: ['crm-contacts-upload', contactSearch],
    queryFn: () =>
      contactSearch.trim()
        ? crmApi.searchContacts(contactSearch, { size: 8 }).then((r) => r.data.data)
        : crmApi.getContacts({ size: 8 }).then((r) => r.data.data),
    enabled: open && showContactPicker,
  })

  const uploadMutation = useMutation({
    mutationFn: () => invoicesApi.uploadFromExcel(file!, selectedContact?.id),
    onSuccess: (res) => {
      const r = res.data.data
      setResult(r)
      qc.invalidateQueries({ queryKey: ['invoices'] })
      if (r.failed === 0) {
        toast.success(`${r.successful} invoice(s) imported`)
      } else {
        toast.success(`${r.successful} imported, ${r.failed} failed`)
      }
      onSuccess()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  async function handleDownloadTemplate() {
    try {
      const res = await invoicesApi.downloadTemplate()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'invoice-upload-template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download template')
    }
  }

  function handleFileSelect(f: File | null) {
    if (!f) return
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error('Only .xlsx and .xls files are supported')
      return
    }
    setFile(f)
    setResult(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0] ?? null)
  }

  function pickContact(c: Contact) {
    setSelectedContact(c)
    setShowContactPicker(false)
    setContactSearch('')
  }

  function handleClose() {
    setFile(null)
    setResult(null)
    setSelectedContact(null)
    setContactSearch('')
    setShowContactPicker(false)
    onClose()
  }

  const contacts = contactsData?.content ?? []

  return (
    <Modal open={open} onClose={handleClose} title="Upload Invoices from Excel" size="md">
      <div className="space-y-5">

        {/* Download template link */}
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[8px] px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-green-800">Need a template?</p>
            <p className="text-[12px] text-green-600 mt-0.5">Download the Excel template with all required columns and a sample row.</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-green-700 hover:text-green-900 transition-colors whitespace-nowrap ml-3"
          >
            <Download size={14} />
            Download Template
          </button>
        </div>

        {/* File drop zone */}
        <div>
          <label className="block text-[12px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Excel File (.xlsx / .xls)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`
              border-2 border-dashed rounded-[10px] p-6 text-center cursor-pointer transition-all
              ${dragOver ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'}
              ${file ? 'border-green-400 bg-green-50' : ''}
            `}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet size={22} className="text-green-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[13.5px] font-semibold text-green-700 truncate max-w-xs">{file.name}</p>
                  <p className="text-[12px] text-green-500">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null) }}
                  className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={28} />
                <p className="text-[13px] font-medium">Drop your Excel file here or click to browse</p>
                <p className="text-[11.5px]">Supports .xlsx and .xls</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Optional contact picker */}
        <div>
          <label className="block text-[12px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Customer Contact <span className="text-gray-400 font-normal normal-case">(optional — overrides customer columns in Excel)</span>
          </label>

          {selectedContact ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] border border-green-300 bg-green-50">
              <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 truncate">
                  {selectedContact.firstName} {selectedContact.lastName}
                </p>
                <p className="text-[11.5px] text-gray-500 truncate">{selectedContact.email}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-gray-400 hover:text-red-400 transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowContactPicker((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[8px] border border-gray-200 text-[13px] text-gray-500 hover:border-green-400 hover:bg-gray-50 transition-all text-left"
              >
                <User size={14} className="text-gray-400" />
                <span>Search and select a contact...</span>
              </button>

              {showContactPicker && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                    <Search size={13} className="text-gray-400 flex-shrink-0" />
                    <input
                      autoFocus
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="flex-1 text-[13px] outline-none text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {contacts.length === 0 ? (
                      <p className="text-[12.5px] text-gray-400 text-center py-4">No contacts found</p>
                    ) : (
                      contacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickContact(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-green-700">
                            {(c.firstName?.[0] ?? '') + (c.lastName?.[0] ?? '')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-gray-800 truncate">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-[11.5px] text-gray-400 truncate">{c.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload result */}
        {result && (
          <div className="rounded-[10px] border border-gray-200 overflow-hidden">
            <div className={`flex items-center gap-3 px-4 py-3 ${result.failed === 0 ? 'bg-green-50 border-b border-green-100' : 'bg-amber-50 border-b border-amber-100'}`}>
              {result.failed === 0
                ? <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                : <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
              }
              <div>
                <p className="text-[13.5px] font-semibold text-gray-800">
                  {result.successful} of {result.total} invoice(s) imported
                  {result.failed > 0 && `, ${result.failed} failed`}
                </p>
              </div>
            </div>

            {result.createdInvoiceNumbers.length > 0 && (
              <div className="px-4 py-3 bg-white">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Created</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.createdInvoiceNumbers.map((n) => (
                    <span key={n} className="text-[11.5px] font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{n}</span>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                <p className="text-[11px] font-bold uppercase tracking-wide text-red-400 mb-2">Errors</p>
                <div className="space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-[12px] text-red-700">
                      <span className="font-semibold">{e.reference}:</span> {e.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {result ? (
            <Button
              onClick={() => { setFile(null); setResult(null); setSelectedContact(null) }}
              variant="outline"
            >
              Upload Another
            </Button>
          ) : (
            <Button
              icon={<Upload size={14} />}
              loading={uploadMutation.isPending}
              disabled={!file}
              onClick={() => uploadMutation.mutate()}
            >
              Import Invoices
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}