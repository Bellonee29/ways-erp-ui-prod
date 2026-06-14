import { apiClient } from './client'
import type { ApiResponse } from '@/types'

export interface AnalyticsSummary {
  totalInvoices: number
  fiscalized: number
  failed: number
  pending: number
  totalAmount: number
  startDate: string
  endDate: string
}

export interface MonthlyPoint {
  month: string       // "yyyy-MM"
  total: number
  fiscalized: number
  failed: number
  amount: number
}

export interface TenantBreakdownRow {
  tenantId: string
  tenantName: string
  totalInvoices: number
  fiscalized: number
  totalAmount: number
}

export const analyticsApi = {
  getSummary: (params?: { tenantId?: string; startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<AnalyticsSummary>>('/analytics/summary', { params }),

  getMonthly: (params?: { tenantId?: string; startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<MonthlyPoint[]>>('/analytics/monthly', { params }),

  getTenantBreakdown: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<TenantBreakdownRow[]>>('/analytics/tenants', { params }),

  exportExcel: (params: { tenantId?: string; startDate?: string; endDate?: string; status?: string }) =>
    apiClient.get('/invoices/export/excel', { params, responseType: 'blob' }),

  exportCsv: (params: { tenantId?: string; startDate?: string; endDate?: string; status?: string }) =>
    apiClient.get('/invoices/export/csv', { params, responseType: 'blob' }),
}