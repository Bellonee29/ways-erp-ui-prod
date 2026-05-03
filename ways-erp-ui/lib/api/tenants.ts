import { apiClient } from './client'
import type { ApiResponse, Page, Tenant, PageParams } from '@/types'

export const tenantsApi = {
  getAll: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Tenant>>>('/tenants', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Tenant>>(`/tenants/${id}`),

  update: (id: string, data: Partial<Tenant>) =>
    apiClient.put<ApiResponse<Tenant>>(`/tenants/${id}`, data),

  activate: (id: string) =>
    apiClient.put<ApiResponse<Tenant>>(`/tenants/${id}/activate`),

  deactivate: (id: string) =>
    apiClient.put<ApiResponse<Tenant>>(`/tenants/${id}/deactivate`),
}