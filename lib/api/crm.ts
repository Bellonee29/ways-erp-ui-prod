import { apiClient } from './client'
import type {
  ApiResponse, Page, Contact, CrmCompany, Lead, Pipeline,
  Deal, CrmActivity, LeadStatus, PageParams,
} from '@/types'

export const crmApi = {
  // Contacts
  createContact: (data: Partial<Contact>) =>
    apiClient.post<ApiResponse<Contact>>('/crm/contacts', data),

  getContacts: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Contact>>>('/crm/contacts', { params }),

  updateContact: (id: string, data: Partial<Contact>) =>
    apiClient.put<ApiResponse<Contact>>(`/crm/contacts/${id}`, data),

  deleteContact: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/crm/contacts/${id}`),

  searchContacts: (q: string, params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Contact>>>('/crm/contacts/search', { params: { q, ...params } }),

  // Companies
  createCompany: (data: Partial<CrmCompany>) =>
    apiClient.post<ApiResponse<CrmCompany>>('/crm/companies', data),

  getCompanies: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<CrmCompany>>>('/crm/companies', { params }),

  updateCompany: (id: string, data: Partial<CrmCompany>) =>
    apiClient.put<ApiResponse<CrmCompany>>(`/crm/companies/${id}`, data),

  // Leads
  createLead: (data: Partial<Lead>) =>
    apiClient.post<ApiResponse<Lead>>('/crm/leads', data),

  getLeads: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Lead>>>('/crm/leads', { params }),

  getLeadsByStatus: (status: LeadStatus, params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Lead>>>('/crm/leads/by-status', { params: { status, ...params } }),

  getLeadSummary: () =>
    apiClient.get<ApiResponse<Record<string, number>>>('/crm/leads/summary'),

  updateLead: (id: string, data: Partial<Lead>) =>
    apiClient.put<ApiResponse<Lead>>(`/crm/leads/${id}`, data),

  // Pipelines & Deals
  getPipelines: () =>
    apiClient.get<ApiResponse<Pipeline[]>>('/crm/pipelines'),

  createDeal: (data: unknown) =>
    apiClient.post<ApiResponse<Deal>>('/crm/deals', data),

  getDeals: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Deal>>>('/crm/deals', { params }),

  markDealWon: (id: string) =>
    apiClient.post<ApiResponse<Deal>>(`/crm/deals/${id}/won`),

  markDealLost: (id: string) =>
    apiClient.post<ApiResponse<Deal>>(`/crm/deals/${id}/lost`),

  // Activities
  createActivity: (data: unknown) =>
    apiClient.post<ApiResponse<CrmActivity>>('/crm/activities', data),

  getActivities: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<CrmActivity>>>('/crm/activities', { params }),

  completeActivity: (id: string) =>
    apiClient.put<ApiResponse<CrmActivity>>(`/crm/activities/${id}/complete`),
}