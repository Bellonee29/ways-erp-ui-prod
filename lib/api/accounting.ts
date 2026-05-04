import { apiClient } from './client'
import type {
  ApiResponse, Page, ChartOfAccount, JournalEntry, BankAccount,
  Bill, Payment, TrialBalance, CreateChartOfAccountRequest, AccountType, PageParams,
} from '@/types'

export const accountingApi = {
  // Chart of Accounts
  createAccount: (data: CreateChartOfAccountRequest) =>
    apiClient.post<ApiResponse<ChartOfAccount>>('/accounting/chart-of-accounts', data),

  getAccounts: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<ChartOfAccount>>>('/accounting/chart-of-accounts', { params }),

  getAccountsByType: (accountType: AccountType) =>
    apiClient.get<ApiResponse<ChartOfAccount[]>>('/accounting/chart-of-accounts/by-type', {
      params: { accountType },
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

  getJournalEntries: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<JournalEntry>>>('/accounting/journal-entries', { params }),

  getJournalEntryById: (id: string) =>
    apiClient.get<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}`),

  // Bank Accounts
  createBankAccount: (data: unknown) =>
    apiClient.post<ApiResponse<BankAccount>>('/accounting/bank-accounts', data),

  getBankAccounts: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<BankAccount>>>('/accounting/bank-accounts', { params }),

  getBankAccountById: (id: string) =>
    apiClient.get<ApiResponse<BankAccount>>(`/accounting/bank-accounts/${id}`),

  updateBankAccount: (id: string, data: unknown) =>
    apiClient.put<ApiResponse<BankAccount>>(`/accounting/bank-accounts/${id}`, data),

  // Bills
  createBill: (data: unknown) =>
    apiClient.post<ApiResponse<Bill>>('/accounting/bills', data),

  getBills: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Bill>>>('/accounting/bills', { params }),

  updateBill: (id: string, data: unknown) =>
    apiClient.put<ApiResponse<Bill>>(`/accounting/bills/${id}`, data),

  approveBill: (id: string) =>
    apiClient.post<ApiResponse<Bill>>(`/accounting/bills/${id}/approve`),

  payBill: (id: string) =>
    apiClient.post<ApiResponse<Bill>>(`/accounting/bills/${id}/pay`),

  // Payments
  createPayment: (data: unknown) =>
    apiClient.post<ApiResponse<Payment>>('/accounting/payments', data),

  getPayments: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Payment>>>('/accounting/payments', { params }),

  // Reports
  getTrialBalance: () =>
    apiClient.get<ApiResponse<TrialBalance>>('/accounting/reports/trial-balance'),

  getProfitAndLoss: () =>
    apiClient.get<ApiResponse<unknown>>('/accounting/reports/profit-and-loss'),

  getBalanceSheet: () =>
    apiClient.get<ApiResponse<unknown>>('/accounting/reports/balance-sheet'),
}