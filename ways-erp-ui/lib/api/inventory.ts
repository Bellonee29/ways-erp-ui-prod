import { apiClient } from './client'
import type {
  ApiResponse, Page, Product, ProductCategory, Warehouse,
  StockLevel, PurchaseOrder, SalesOrder, PageParams, StockMovement,
} from '@/types'

export const inventoryApi = {
  // Categories — backend returns List, not Page
  createCategory: (data: { name: string; description?: string; parentId?: string }) =>
    apiClient.post<ApiResponse<ProductCategory>>('/inventory/categories', data),

  getCategories: () =>
    apiClient.get<ApiResponse<ProductCategory[]>>('/inventory/categories'),

  getCategoryById: (id: string) =>
    apiClient.get<ApiResponse<ProductCategory>>(`/inventory/categories/${id}`),

  updateCategory: (id: string, data: { name: string; description?: string }) =>
    apiClient.put<ApiResponse<ProductCategory>>(`/inventory/categories/${id}`, data),

  deleteCategory: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/inventory/categories/${id}`),

  // Products
  createProduct: (data: unknown) =>
    apiClient.post<ApiResponse<Product>>('/inventory/products', data),

  getProducts: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Product>>>('/inventory/products', { params }),

  searchProducts: (q: string, params?: PageParams) =>
    apiClient.get<ApiResponse<Page<Product>>>('/inventory/products/search', { params: { q, ...params } }),

  getProductById: (id: string) =>
    apiClient.get<ApiResponse<Product>>(`/inventory/products/${id}`),

  updateProduct: (id: string, data: unknown) =>
    apiClient.put<ApiResponse<Product>>(`/inventory/products/${id}`, data),

  deleteProduct: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/inventory/products/${id}`),

  // Warehouses — backend returns List, not Page
  createWarehouse: (data: { name: string; location?: string; address?: string }) =>
    apiClient.post<ApiResponse<Warehouse>>('/inventory/warehouses', data),

  getWarehouses: () =>
    apiClient.get<ApiResponse<Warehouse[]>>('/inventory/warehouses'),

  getWarehouseById: (id: string) =>
    apiClient.get<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`),

  updateWarehouse: (id: string, data: { name: string; location?: string; address?: string }) =>
    apiClient.put<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`, data),

  deactivateWarehouse: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/inventory/warehouses/${id}`),

  // Stock — uses Page (backend paginates)
  getCurrentStock: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<StockLevel>>>('/inventory/stock', { params }),

  // Correct endpoint: /stock/adjustments (not /stock/adjust)
  adjustStock: (data: { productId: string; warehouseId: string; newQuantity: number; reason: string }) =>
    apiClient.post<ApiResponse<void>>('/inventory/stock/adjustments', data),

  getStockMovements: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<StockMovement>>>('/inventory/stock/movements', { params }),

  getLowStockAlerts: () =>
    apiClient.get<ApiResponse<StockLevel[]>>('/inventory/stock/low'),

  transferStock: (data: { productId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; reason?: string }) =>
    apiClient.post<ApiResponse<string>>('/inventory/stock/transfer', data),

  // Purchase Orders
  createPurchaseOrder: (data: unknown) =>
    apiClient.post<ApiResponse<PurchaseOrder>>('/inventory/purchase-orders', data),

  getPurchaseOrders: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<PurchaseOrder>>>('/inventory/purchase-orders', { params }),

  getPurchaseOrderById: (id: string) =>
    apiClient.get<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}`),

  confirmPurchaseOrder: (id: string) =>
    apiClient.post<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}/confirm`),

  receivePurchaseOrder: (id: string) =>
    apiClient.post<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}/receive`),

  cancelPurchaseOrder: (id: string) =>
    apiClient.post<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}/cancel`),

  // Sales Orders
  createSalesOrder: (data: unknown) =>
    apiClient.post<ApiResponse<SalesOrder>>('/inventory/sales-orders', data),

  getSalesOrders: (params?: PageParams) =>
    apiClient.get<ApiResponse<Page<SalesOrder>>>('/inventory/sales-orders', { params }),

  getSalesOrderById: (id: string) =>
    apiClient.get<ApiResponse<SalesOrder>>(`/inventory/sales-orders/${id}`),

  confirmSalesOrder: (id: string) =>
    apiClient.post<ApiResponse<SalesOrder>>(`/inventory/sales-orders/${id}/confirm`),

  fulfillSalesOrder: (id: string) =>
    apiClient.post<ApiResponse<SalesOrder>>(`/inventory/sales-orders/${id}/fulfill`),

  cancelSalesOrder: (id: string) =>
    apiClient.post<ApiResponse<SalesOrder>>(`/inventory/sales-orders/${id}/cancel`),
}