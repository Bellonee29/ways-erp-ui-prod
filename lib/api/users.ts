import { apiClient } from './client'
import type {
  ApiResponse, Page, User, UserStats, Permission,
  CreateUserRequest, CreateDivisionAdminRequest, ApproveManagerRequest, UpdateUserPermissionsRequest, PageParams,
} from '@/types'

export const usersApi = {
  // TENANT_ADMIN creates a division admin
  createDivisionAdmin: (data: CreateDivisionAdminRequest) =>
    apiClient.post<ApiResponse<User>>('/users/create-division-admin', data),

  // DIVISION_ADMIN / TENANT_ADMIN creates a regular user
  createUser: (data: CreateUserRequest) =>
    apiClient.post<ApiResponse<User>>('/users/create', data),

  // Approval
  getPendingManagers: () =>
    apiClient.get<ApiResponse<User[]>>('/users/pending-managers'),

  approveManager: (data: ApproveManagerRequest) =>
    apiClient.post<ApiResponse<User>>('/users/approve-manager', data),

  // My users (manager scope)
  getMyUsers: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<User>>>('/users/my-users', { params }),

  searchMyUsers: (query: string, params?: PageParams) =>
    apiClient.get<ApiResponse<Page<User>>>('/users/my-users/search', { params: { query, ...params } }),

  getMyUsersCount: () =>
    apiClient.get<ApiResponse<number>>('/users/my-users/count'),

  // Admin scope
  getAllUsers: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<User>>>('/users/all', { params }),

  searchAllUsers: (query: string, params?: PageParams) =>
    apiClient.get<ApiResponse<Page<User>>>('/users/all/search', { params: { query, ...params } }),

  getAllUsersCount: () =>
    apiClient.get<ApiResponse<number>>('/users/all/count'),

  getStats: () =>
    apiClient.get<ApiResponse<UserStats>>('/users/stats'),

  // User management
  getUserById: (userId: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${userId}`),

  toggleActive: (userId: string) =>
    apiClient.put<ApiResponse<User>>(`/users/${userId}/toggle-active`),

  deleteUser: (userId: string) =>
    apiClient.delete<ApiResponse<void>>(`/users/${userId}`),

  updatePermissions: (userId: string, data: UpdateUserPermissionsRequest) =>
    apiClient.put<ApiResponse<void>>(`/users/${userId}/permissions`, data),

  // Permissions
  getAvailablePermissions: () =>
    apiClient.get<ApiResponse<Permission[]>>('/users/permissions/available'),

  getPermissionCategories: () =>
    apiClient.get<ApiResponse<Record<string, Permission[]>>>('/users/permissions/categories'),
}