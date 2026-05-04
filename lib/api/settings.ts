import { apiClient } from './client'
import type { ApiResponse, User } from '@/types'

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  phone?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface TenantProfile {
  id: string
  name: string
  slug?: string
  domain?: string
  contactEmail?: string
  country?: string
  plan?: string
  logoUrl?: string
  isActive?: boolean
}

export interface CryptoKeyStatusResponse {
  hasActiveKey: boolean
  keyId?: string
  uploadedAt?: string
  expiresAt?: string
  isLocked?: boolean
  uploadedBy?: string
}

export interface UploadCryptoKeyRequest {
  publicKey: string
  certificate: string
}

export interface UpdateFirsCredentialsRequest {
  serviceId: string
  businessId: string
}

export interface DivisionKeyStatusResponse {
  divisionId: string
  divisionName: string
  contactEmail?: string
  keyStatus: CryptoKeyStatusResponse
}

export const settingsApi = {
  /** Get current user's own profile */
  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/users/me'),

  /** Update name / phone */
  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<ApiResponse<User>>('/users/me/profile', data),

  /** Change password */
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<ApiResponse<string>>('/auth/change-password', data),

  /** Get current user's tenant info (including logoUrl) */
  getMyTenant: () =>
    apiClient.get<ApiResponse<TenantProfile>>('/tenants/me'),

  /** Upload / replace logo (multipart/form-data) */
  uploadLogo: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ApiResponse<TenantProfile>>('/tenants/me/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** Get crypto key status for this division (DIVISION_ADMIN only) */
  getCryptoKeyStatus: () =>
    apiClient.get<ApiResponse<CryptoKeyStatusResponse>>('/settings/crypto-keys/status'),

  /** Get all division key statuses (TENANT_ADMIN only) */
  getDivisionKeyStatuses: () =>
    apiClient.get<ApiResponse<DivisionKeyStatusResponse[]>>('/settings/crypto-keys/divisions'),

  /** Upload / replace keys for a specific division (TENANT_ADMIN only) */
  uploadKeysForDivision: (divisionId: string, data: UploadCryptoKeyRequest) =>
    apiClient.post<ApiResponse<CryptoKeyStatusResponse>>(`/settings/crypto-keys/divisions/${divisionId}`, data),

  /** Update FIRS credentials for a specific division (TENANT_ADMIN only) */
  updateFirsCredentialsForDivision: (divisionId: string, data: UpdateFirsCredentialsRequest) =>
    apiClient.put<ApiResponse<void>>(`/settings/crypto-keys/divisions/${divisionId}/firs-credentials`, data),
}