import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Attach JWT on every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ways_erp_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global response handler — redirect to login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ways_erp_token')
      localStorage.removeItem('ways_erp_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export type ApiError = AxiosError<{ message?: string; error?: string }>

/** Extract a human-readable message from an Axios error */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as Record<string, unknown> | undefined
    const msg =
      (data?.message as string) ||
      (data?.error as string) ||
      error.message ||
      'Request failed'
    return status ? `[${status}] ${msg}` : msg
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}