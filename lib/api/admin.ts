import { apiClient } from './client'
import type { ApiResponse, Page } from '@/types'

export interface TenantDetail {
  id: string
  name: string
  organizationName: string
  slug: string
  domain?: string
  plan?: string
  isActive: boolean
  isApproved: boolean
  startDate?: string
  endDate?: string
  isExpired: boolean
  contactEmail?: string
  country?: string
  createdAt: string
  adminEmail?: string
  adminName?: string
  totalUsers: number
}

export const adminApi = {
  getAllTenants: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<Page<TenantDetail>>>('/admin/tenants', { params: { page, size } }),

  getPendingTenants: () =>
    apiClient.get<ApiResponse<TenantDetail[]>>('/admin/tenants/pending'),

  approveTenant: (tenantId: string) =>
    apiClient.post<ApiResponse<TenantDetail>>(`/admin/tenants/${tenantId}/approve`),

  disableTenant: (tenantId: string) =>
    apiClient.post<ApiResponse<void>>(`/admin/tenants/${tenantId}/disable`),

  enableTenant: (tenantId: string) =>
    apiClient.post<ApiResponse<TenantDetail>>(`/admin/tenants/${tenantId}/enable`),

  renewLicense: (tenantId: string, months = 12) =>
    apiClient.post<ApiResponse<TenantDetail>>(`/admin/tenants/${tenantId}/renew`, null, {
      params: { months },
    }),
}