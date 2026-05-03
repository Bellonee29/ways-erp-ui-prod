import { apiClient } from './client'
import type {
  ApiResponse, AuthResponse, LoginRequest,
  Verify2FARequest, ChangePasswordRequest, RegisterRequest,
} from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/login', data),

  verify2FA: (data: Verify2FARequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-2fa', data),

  resendOtp: (email: string) =>
    apiClient.post<ApiResponse<void>>('/auth/resend-otp', { email }),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<ApiResponse<void>>('/auth/change-password', data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<void>>('/auth/register', data),
}