import { apiClient } from '@/lib/api-client';

export interface Organization {
  id: string;
  name: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Level {
  id: string;
  levelNumber: string;
  description?: string;
}

export interface OrganizationResponse {
  success: boolean;
  data?: Organization | Organization[];
  message?: string;
}

export interface DepartmentResponse {
  success: boolean;
  data?: Department | Department[];
  message?: string;
}

export interface LevelResponse {
  success: boolean;
  data?: Level | Level[];
  message?: string;
}

export const organizationsApi = {
  getAll: async (): Promise<OrganizationResponse> => {
    return apiClient.get<OrganizationResponse>('/organizations');
  },
};

export const departmentsApi = {
  getAll: async (): Promise<DepartmentResponse> => {
    return apiClient.get<DepartmentResponse>('/departments');
  },
};

export const levelsApi = {
  getAll: async (): Promise<LevelResponse> => {
    return apiClient.get<LevelResponse>('/levels');
  },
};
