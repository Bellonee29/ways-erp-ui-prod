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

export interface CompanySettingsRequest {
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
}

export interface CompanySettings {
  id: string
  name: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
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

  /** Get root (own tenant) FIRS key status (TENANT_ADMIN only) */
  getRootKeyStatus: () =>
    apiClient.get<ApiResponse<CryptoKeyStatusResponse>>('/settings/crypto-keys/root/status'),

  /** Upload / replace root FIRS keys for the TENANT_ADMIN's own tenant */
  uploadKeysForRoot: (data: UploadCryptoKeyRequest) =>
    apiClient.post<ApiResponse<CryptoKeyStatusResponse>>('/settings/crypto-keys/root/keys', data),

  /** Update FIRS credentials for the TENANT_ADMIN's own tenant */
  updateFirsCredentialsForRoot: (data: UpdateFirsCredentialsRequest) =>
    apiClient.put<ApiResponse<void>>('/settings/crypto-keys/root/firs-credentials', data),

  /** Get own company receipt settings */
  getCompanySettings: () =>
    apiClient.get<ApiResponse<CompanySettings>>('/tenants/me/company'),

  /** Update own company receipt settings */
  updateCompanySettings: (data: CompanySettingsRequest) =>
    apiClient.put<ApiResponse<CompanySettings>>('/tenants/me/company', data),

  /** Get all division company settings (TENANT_ADMIN only) */
  getDivisionCompanySettings: () =>
    apiClient.get<ApiResponse<CompanySettings[]>>('/tenants/me/company/divisions'),

  /** Update a specific division's company settings (TENANT_ADMIN only) */
  updateDivisionCompanySettings: (divisionId: string, data: CompanySettingsRequest) =>
    apiClient.put<ApiResponse<CompanySettings>>(`/tenants/me/company/divisions/${divisionId}`, data),
}