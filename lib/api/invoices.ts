import { apiClient } from './client'
import type {
  ApiResponse, Page, Invoice, FiscalizationResponse,
  CreateInvoiceRequest, CreditDebitNote, PageParams,
} from '@/types'

export interface InvoiceUploadResult {
  total: number
  successful: number
  failed: number
  createdInvoiceNumbers: string[]
  errors: Array<{ reference: string; error: string }>
}

export const invoicesApi = {
  create: (data: CreateInvoiceRequest) =>
    apiClient.post<ApiResponse<Invoice>>('/invoices', data),

  getMyInvoices: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Invoice>>>('/invoices', { params }),

  getAllInvoices: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Invoice>>>('/invoices/all', { params }),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/invoices/${id}`),

  fiscalize: (id: string) =>
    apiClient.post<ApiResponse<FiscalizationResponse>>(`/invoices/${id}/fiscalize`),

  // Receipts & PDFs
  getReceiptByInvoice: (invoiceId: string) =>
    apiClient.get(`/receipts/invoice/${invoiceId}`, { responseType: 'blob' }),

  /** Download a PDF copy of the invoice itself */
  downloadInvoice: (invoiceId: string) =>
    apiClient.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' }),

  /** Upload invoices from an Excel file. contactId is optional. */
  uploadFromExcel: (file: File, contactId?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (contactId) form.append('contactId', contactId)
    return apiClient.post<ApiResponse<InvoiceUploadResult>>('/invoices/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** Download the Excel upload template */
  downloadTemplate: () =>
    apiClient.get('/invoices/upload/template', { responseType: 'blob' }),

  // Credit / Debit Notes
  createNote: (data: {
    originalInvoiceId: string
    noteType: 'CREDIT' | 'DEBIT'
    issueDate: string
    reason: string
    notes?: string
    items: Array<{
      originalInvoiceItemId?: string
      description: string
      quantity: number
      unitPrice: number
      taxRate: number
      discountAmount?: number
    }>
  }) => apiClient.post<ApiResponse<CreditDebitNote>>('/credit-debit-notes', data),

  getMyNotes: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<CreditDebitNote>>>('/credit-debit-notes', { params }),

  updatePaymentStatus: (id: string, status: string, amount?: number) => {
    const params: Record<string, string | number> = { status }
    if (amount !== undefined) params.amount = amount
    return apiClient.patch<ApiResponse<void>>(`/invoices/${id}/payment-status`, null, { params })
  },
}