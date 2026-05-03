'use client'

import { Download, Zap, X, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge, { invoiceStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice } from '@/types'

interface Props {
  invoice: Invoice
  onClose: () => void
  onFiscalize: () => void
  onDownload: () => void
  fiscalizing?: boolean
}

export default function InvoicePreviewModal({
  invoice,
  onClose,
  onFiscalize,
  onDownload,
  fiscalizing,
}: Props) {
  const fiscalized = invoice.fiscalizationStatus === 'COMPLETED'
  const isDraft = invoice.status === 'DRAFT'
  const cur = invoice.currency ?? 'NGN'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mx-auto my-8 max-w-3xl w-full px-4">
        <div className="bg-white rounded-[14px] shadow-2xl overflow-hidden">

          {/* ── Header bar ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.07em] text-gray-400">Invoice</p>
                <p className="text-[17px] font-extrabold text-gray-900 leading-tight">{invoice.invoiceNumber}</p>
              </div>
              <Badge variant={invoiceStatusBadge(invoice.status)}>{invoice.status}</Badge>
              {fiscalized && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={11} /> FISCALIZED
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
              <X size={20} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5 space-y-5">

            {/* Bill-to + Dates row */}
            <div className="grid grid-cols-2 gap-5">
              {/* Bill to */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.07em] text-gray-400 mb-1.5">Bill To</p>
                <p className="text-[14px] font-bold text-gray-900">{invoice.customerName}</p>
                {invoice.customerAddress && (
                  <p className="text-[12px] text-gray-500 mt-0.5">{invoice.customerAddress}</p>
                )}
                {invoice.customerEmail && (
                  <p className="text-[12px] text-gray-500 mt-0.5">{invoice.customerEmail}</p>
                )}
                {invoice.customerPhone && (
                  <p className="text-[12px] text-gray-500 mt-0.5">{invoice.customerPhone}</p>
                )}
                {invoice.customerTin && (
                  <p className="text-[12px] text-gray-500 mt-0.5">TIN: {invoice.customerTin}</p>
                )}
              </div>

              {/* Dates + Currency */}
              <div className="text-right space-y-1.5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.07em] text-gray-400">Issue Date</p>
                  <p className="text-[13px] text-gray-800">{formatDate(invoice.issueDate ?? invoice.createdAt)}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.07em] text-gray-400 mt-1">Due Date</p>
                    <p className="text-[13px] text-gray-800">{formatDate(invoice.dueDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.07em] text-gray-400 mt-1">Currency</p>
                  <p className="text-[13px] font-semibold text-gray-800">{cur}</p>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-hidden rounded-[8px] border border-gray-200">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="text-left px-3 py-2.5 font-semibold">Description</th>
                    <th className="text-center px-3 py-2.5 font-semibold">Qty</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Unit Price</th>
                    <th className="text-center px-3 py-2.5 font-semibold">VAT %</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Discount</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items ?? []).map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                      <td className="px-3 py-2.5 text-gray-800">{item.description}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">
                        {item.quantity % 1 === 0 ? item.quantity : item.quantity?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">{formatCurrency(item.unitPrice, cur)}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">
                        {item.taxRate != null ? `${item.taxRate}%` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.discountAmount && item.discountAmount > 0
                          ? formatCurrency(item.discountAmount, cur)
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                        {formatCurrency(item.totalAmount, cur)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-0 border border-gray-200 rounded-[8px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 text-[12.5px]">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">{formatCurrency(invoice.subtotal, cur)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 text-[12.5px] border-t border-gray-100">
                  <span className="text-gray-500">VAT</span>
                  <span className="font-medium text-gray-800">{formatCurrency(invoice.taxAmount, cur)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-[13.5px] font-bold bg-green-50 border-t border-green-200">
                  <span className="text-green-800">Total Due</span>
                  <span className="text-green-700">{formatCurrency(invoice.totalAmount, cur)}</span>
                </div>
              </div>
            </div>

            {/* FIRS details — fiscalized only */}
            {fiscalized && (
              <div className="bg-green-50 border border-green-200 rounded-[10px] p-4 flex items-start gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[.07em] text-green-700 mb-2">
                    FIRS Fiscalization Details
                  </p>
                  {invoice.irn && (
                    <p className="text-[12.5px] text-gray-700">
                      <span className="font-semibold">IRN:</span>{' '}
                      <span className="font-mono break-all">{invoice.irn}</span>
                    </p>
                  )}
                  {invoice.firsValidationCode && (
                    <p className="text-[12.5px] text-gray-700">
                      <span className="font-semibold">Validation Code:</span>{' '}
                      <span className="font-mono">{invoice.firsValidationCode}</span>
                    </p>
                  )}
                  {invoice.fiscalizedAt && (
                    <p className="text-[12.5px] text-gray-500">
                      Fiscalized: {formatDate(invoice.fiscalizedAt)}
                    </p>
                  )}
                </div>
                {invoice.qrCode && (
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <img
                      src={invoice.qrCode.startsWith('data:') ? invoice.qrCode : `data:image/png;base64,${invoice.qrCode}`}
                      alt="FIRS QR Code"
                      className="w-24 h-24 rounded-[6px] border border-green-300 bg-white p-1"
                    />
                    <p className="text-[10px] text-green-600 font-semibold">Scan to verify</p>
                  </div>
                )}
              </div>
            )}

            {/* DRAFT notice */}
            {isDraft && !fiscalized && (
              <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4 text-[13px] text-amber-700">
                This invoice is a draft and has not been submitted to FIRS. Click <strong>Fiscalize</strong> below
                to send it for fiscalization.
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.07em] text-gray-400 mb-1">Notes</p>
                <p className="text-[12.5px] text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* ── Footer actions ── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60">
            <button
              onClick={onClose}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" icon={<Download size={14} />} onClick={onDownload}>
                Download PDF
              </Button>
              {isDraft && !fiscalized && (
                <Button
                  icon={<Zap size={14} />}
                  loading={fiscalizing}
                  onClick={onFiscalize}
                >
                  Fiscalize Invoice
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}