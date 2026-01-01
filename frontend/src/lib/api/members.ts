import { apiClient } from '@/lib/api-client';

export interface Member {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  organizationId?: string;
  departmentId?: string;
  levelId?: string;
  joinDate?: string;
  membershipStatus: 'active' | 'inactive' | 'transferred';
  isFirstTimer?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberResponse {
  success: boolean;
  data?: Member | Member[];
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const membersApi = {
  // Get all members
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    levelId?: string;
    organizationId?: string;
    status?: string;
  }): Promise<MemberResponse> => {
    const queryString = params ? `?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]) as [string, string][]).toString()}` : '';
    return apiClient.get<MemberResponse>(`/members${queryString}`);
  },

  // Get member by ID
  getById: async (id: string): Promise<MemberResponse> => {
    return apiClient.get<MemberResponse>(`/members/${id}`);
  },

  // Create member
  create: async (data: Partial<Member>): Promise<MemberResponse> => {
    return apiClient.post<MemberResponse>('/members', data);
  },

  // Update member
  update: async (id: string, data: Partial<Member>): Promise<MemberResponse> => {
    return apiClient.put<MemberResponse>(`/members/${id}`, data);
  },

  // Delete member
  delete: async (id: string): Promise<MemberResponse> => {
    return apiClient.delete<MemberResponse>(`/members/${id}`);
  },

  // Get birthdays
  getBirthdays: async (month?: number): Promise<MemberResponse> => {
    const queryString = month ? `?month=${month}` : '';
    return apiClient.get<MemberResponse>(`/members/birthdays${queryString}`);
  },

  // Get first timers
  getFirstTimers: async (): Promise<MemberResponse> => {
    return apiClient.get<MemberResponse>('/members/first-timers');
  },
};
