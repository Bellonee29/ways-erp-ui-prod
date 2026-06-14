import { apiClient } from './client'
import type {
  ApiResponse, AuthResponse, LoginRequest,
  Verify2FARequest, ChangePasswordRequest, RegisterRequest,
  TotpSetupResponse, TotpSetupVerifyResponse, TotpStatusResponse,
} from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  verify2FA: (data: Verify2FARequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-2fa', data),

  resendOtp: (email: string) =>
    apiClient.post<ApiResponse<void>>('/auth/resend-otp', { email }),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<ApiResponse<void>>('/auth/change-password', data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<void>>('/auth/register', data),

  // ── TOTP ──────────────────────────────────────────────────────────────────
  setupTotp: () =>
    apiClient.post<ApiResponse<TotpSetupResponse>>('/auth/totp/setup'),

  verifyTotpSetup: (data: { code: string; pendingSecret: string }) =>
    apiClient.post<ApiResponse<TotpSetupVerifyResponse>>('/auth/totp/verify-setup', data),

  disableTotp: (code: string) =>
    apiClient.post<ApiResponse<string>>('/auth/totp/disable', { code }),

  regenerateRecoveryCodes: () =>
    apiClient.post<ApiResponse<string[]>>('/auth/totp/regenerate-codes'),

  getTotpStatus: () =>
    apiClient.get<ApiResponse<TotpStatusResponse>>('/auth/totp/status'),
}