import { apiClient } from '@/lib/api-client';

export interface UserDetails {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  departmentId?: string;
  levelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersResponse {
  users: UserDetails[];
  count: number;
}

export const usersApi = {
  // Get all users with optional filters
  getAll: async (filters?: { role?: string; isApproved?: boolean }): Promise<GetUsersResponse> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.isApproved !== undefined) params.append('isApproved', String(filters.isApproved));
    
    const query = params.toString();
    return apiClient.get<GetUsersResponse>(`/users${query ? `?${query}` : ''}`);
  },

  // Get user by ID
  getById: async (id: string): Promise<{ user: UserDetails }> => {
    return apiClient.get<{ user: UserDetails }>(`/users/${id}`);
  },

  // Approve user
  approve: async (id: string): Promise<{ message: string; user: UserDetails }> => {
    return apiClient.post<{ message: string; user: UserDetails }>(`/users/${id}/approve`);
  },

  // Update user role
  updateRole: async (
    id: string,
    data: { role: string; departmentId?: string; levelId?: string }
  ): Promise<{ message: string; user: UserDetails }> => {
    return apiClient.patch<{ message: string; user: UserDetails }>(`/users/${id}/role`, data);
  },

  // Revoke user access
  revokeAccess: async (id: string): Promise<{ message: string; user: UserDetails }> => {
    return apiClient.post<{ message: string; user: UserDetails }>(`/users/${id}/revoke`);
  },
};
