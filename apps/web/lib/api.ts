import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('workwise_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('workwise_refresh_token');
        if (refreshToken) {
          try {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            localStorage.setItem('workwise_access_token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('workwise_refresh_token', newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          } catch {
            localStorage.removeItem('workwise_access_token');
            localStorage.removeItem('workwise_refresh_token');
            localStorage.removeItem('workwise_user');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const api = {
  // Auth
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const res = await apiClient.post('/auth/login', credentials);
      return res.data;
    },
    register: async (data: { email: string; password: string; name: string; role?: string }) => {
      const res = await apiClient.post('/auth/register', data);
      return res.data;
    },
    logout: async () => {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('workwise_refresh_token') : null;
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } finally {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('workwise_access_token');
          localStorage.removeItem('workwise_refresh_token');
          localStorage.removeItem('workwise_user');
        }
      }
    },
    getProfile: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data.data;
    },
  },

  // Vendors
  vendors: {
    list: async (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string }) => {
      const res = await apiClient.get('/vendors', { params });
      return res.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get(`/vendors/${id}`);
      return res.data.data;
    },
    create: async (data: any) => {
      const res = await apiClient.post('/vendors', data);
      return res.data.data;
    },
    update: async (id: string, data: any) => {
      const res = await apiClient.put(`/vendors/${id}`, data);
      return res.data.data;
    },
    delete: async (id: string) => {
      const res = await apiClient.delete(`/vendors/${id}`);
      return res.data;
    },
    getCategories: async () => {
      const res = await apiClient.get('/vendors/categories');
      return res.data.data;
    },
  },

  // Purchase Orders
  purchaseOrders: {
    list: async (params?: { page?: number; limit?: number; search?: string; status?: string; vendorId?: string }) => {
      const res = await apiClient.get('/purchase-orders', { params });
      return res.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get(`/purchase-orders/${id}`);
      return res.data.data;
    },
    create: async (data: any) => {
      const res = await apiClient.post('/purchase-orders', data);
      return res.data.data;
    },
    update: async (id: string, data: any) => {
      const res = await apiClient.put(`/purchase-orders/${id}`, data);
      return res.data.data;
    },
    updateStatus: async (id: string, action: 'approve' | 'send' | 'cancel' | 'close', reason?: string) => {
      const res = await apiClient.patch(`/purchase-orders/${id}/status`, { action, reason });
      return res.data.data;
    },
  },

  // Goods Receipts
  goodsReceipts: {
    list: async (params?: { page?: number; limit?: number; search?: string; status?: string; poId?: string }) => {
      const res = await apiClient.get('/goods-receipts', { params });
      return res.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get(`/goods-receipts/${id}`);
      return res.data.data;
    },
    create: async (data: any) => {
      const res = await apiClient.post('/goods-receipts', data);
      return res.data.data;
    },
    updateStatus: async (id: string, status: string, rejectionReason?: string) => {
      const res = await apiClient.patch(`/goods-receipts/${id}/status`, { status, rejectionReason });
      return res.data.data;
    },
  },

  // Dashboard
  dashboard: {
    getMetrics: async () => {
      const res = await apiClient.get('/dashboard/metrics');
      return res.data.data;
    },
    getActivity: async (limit = 20) => {
      const res = await apiClient.get('/dashboard/activity', { params: { limit } });
      return res.data.data;
    },
  },
};
