import { apiClient } from './client'
import type {
  ApiResponse, Page, ChartOfAccount, JournalEntry, BankAccount,
  Bill, Payment, TrialBalance, CreateChartOfAccountRequest, AccountType, PageParams,
} from '@/types'

export const accountingApi = {
  // Chart of Accounts
  createAccount: (data: CreateChartOfAccountRequest) =>
    apiClient.post<ApiResponse<ChartOfAccount>>('/accounting/chart-of-accounts', data),

  getAccounts: (params?: { page?: number; size?: number; divisionTenantId?: string }) =>
    apiClient.get<ApiResponse<ChartOfAccount[]>>('/accounting/chart-of-accounts', { params }),

  getAccountsByType: (accountType: AccountType, divisionTenantId?: string) =>
    apiClient.get<ApiResponse<ChartOfAccount[]>>('/accounting/chart-of-accounts/by-type', {
      params: { accountType, ...(divisionTenantId ? { divisionTenantId } : {}) },
    }),

  getAccountById: (id: string) =>
    apiClient.get<ApiResponse<ChartOfAccount>>(`/accounting/chart-of-accounts/${id}`),

  updateAccount: (id: string, data: Partial<CreateChartOfAccountRequest>) =>
    apiClient.put<ApiResponse<ChartOfAccount>>(`/accounting/chart-of-accounts/${id}`, data),

  deleteAccount: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/accounting/chart-of-accounts/${id}`),

  // Journal Entries
  createJournalEntry: (data: unknown) =>
    apiClient.post<ApiResponse<JournalEntry>>('/accounting/journal-entries', data),

  getJournalEntries: (params?: PageParams & { divisionTenantId?: string }) =>
    apiClient.get<ApiResponse<Page<JournalEntry>>>('/accounting/journal-entries', { params }),

  getJournalEntryById: (id: string) =>
    apiClient.get<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}`),

  postEntry: (id: string) =>
    apiClient.post<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}/post`),

  reverseEntry: (id: string) =>
    apiClient.post<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}/reverse`),

  // Chart of Accounts — seed
  seedDefaultAccounts: () =>
    apiClient.post<ApiResponse<ChartOfAccount[]>>('/accounting/chart-of-accounts/seed-defaults'),

  recalculateBalances: () =>
    apiClient.post<ApiResponse<string>>('/accounting/chart-of-accounts/recalculate-balances'),

  // Bank Accounts
  createBankAccount: (data: unknown) =>
    apiClient.post<ApiResponse<BankAccount>>('/accounting/bank-accounts', data),

  getBankAccounts: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<BankAccount>>>('/accounting/bank-accounts', { params }),

  getBankAccountById: (id: string) =>
    apiClient.get<ApiResponse<BankAccount>>(`/accounting/bank-accounts/${id}`),

  updateBankAccount: (id: string, data: unknown) =>
    apiClient.put<ApiResponse<BankAccount>>(`/accounting/bank-accounts/${id}`, data),

  addBankTransaction: (accountId: string, data: unknown) =>
    apiClient.post<ApiResponse<unknown>>(`/accounting/bank-accounts/${accountId}/transactions`, data),

  getBankTransactions: (accountId: string, params?: PageParams) =>
    apiClient.get<ApiResponse<Page<unknown>>>(`/accounting/bank-accounts/${accountId}/transactions`, { params }),

  // Bills
  createBill: (data: unknown) =>
    apiClient.post<ApiResponse<Bill>>('/accounting/bills', data),

  getBills: (params?: PageParams & { divisionTenantId?: string }) =>
    apiClient.get<ApiResponse<Page<Bill>>>('/accounting/bills', { params }),

  getBillById: (id: string) =>
    apiClient.get<ApiResponse<Bill>>(`/accounting/bills/${id}`),

  updateBill: (id: string, data: unknown) =>
    apiClient.put<ApiResponse<Bill>>(`/accounting/bills/${id}`, data),

  /** Confirm a DRAFT bill → PENDING; auto-posts Dr GR/IR / Cr AP journal entry */
  approveBill: (id: string) =>
    apiClient.post<ApiResponse<Bill>>(`/accounting/bills/${id}/approve`),

  /** Record a partial or full payment against a bill (posts Dr AP / Cr Cash GL entry) */
  recordBillPayment: (id: string, data: { amount: number; paymentMethod?: string; paymentDate?: string; reference?: string; notes?: string }) =>
    apiClient.post<ApiResponse<Bill>>(`/accounting/bills/${id}/record-payment`, data),

  /** Create a draft bill pre-populated from a received purchase order */
  createBillFromPo: (poId: string) =>
    apiClient.post<ApiResponse<Bill>>(`/accounting/bills/from-po/${poId}`),

  cancelBill: (id: string) =>
    apiClient.post<ApiResponse<void>>(`/accounting/bills/${id}/cancel`),

  /** Export all journal entries as a downloadable CSV file */
  exportJournalEntriesCsv: (divisionTenantId?: string) =>
    apiClient.get<Blob>('/accounting/journal-entries/export/csv', {
      params: divisionTenantId ? { divisionTenantId } : undefined,
      responseType: 'blob',
    }),

  // Payments
  createPayment: (data: unknown) =>
    apiClient.post<ApiResponse<Payment>>('/accounting/payments', data),

  getPayments: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Payment>>>('/accounting/payments', { params }),

  // Reports
  getTrialBalance: (params?: { fromDate?: string; toDate?: string }) =>
    apiClient.get<ApiResponse<TrialBalance>>('/accounting/reports/trial-balance', { params }),

  getProfitAndLoss: (params?: { fromDate?: string; toDate?: string }) =>
    apiClient.get<ApiResponse<unknown>>('/accounting/reports/profit-and-loss', { params }),

  getBalanceSheet: (params?: { asOf?: string }) =>
    apiClient.get<ApiResponse<unknown>>('/accounting/reports/balance-sheet', { params }),
}