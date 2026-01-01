import { apiClient } from '@/lib/api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      isApproved: boolean;
    };
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isApproved: boolean;
}

export const authApi = {
  // Sign in
  signIn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  // Sign up
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // Get current user
  getCurrentUser: async (): Promise<{ success: boolean; data?: User }> => {
    return apiClient.get('/auth/me');
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/refresh');
  },
};
