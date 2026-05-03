import { apiClient } from './client'
import type { ApiResponse, Division, CreateDivisionRequest } from '@/types'

export const divisionsApi = {
  getDivisions: () =>
    apiClient.get<ApiResponse<Division[]>>('/divisions'),

  getDivision: (divisionId: string) =>
    apiClient.get<ApiResponse<Division>>(`/divisions/${divisionId}`),

  createDivision: (data: CreateDivisionRequest) =>
    apiClient.post<ApiResponse<Division>>('/divisions', data),

  updateDivision: (divisionId: string, data: CreateDivisionRequest) =>
    apiClient.put<ApiResponse<Division>>(`/divisions/${divisionId}`, data),

  deactivateDivision: (divisionId: string) =>
    apiClient.delete<ApiResponse<void>>(`/divisions/${divisionId}`),
}