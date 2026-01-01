import { apiClient } from '@/lib/api-client';

export interface Attendance {
  id: string;
  memberId: string;
  organizationId?: string;
  attendanceDate: string;
  serviceType: string;
  isPresent: boolean;
  notes?: string;
  createdAt?: string;
}

export interface AttendanceResponse {
  success: boolean;
  data?: Attendance | Attendance[];
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const attendanceApi = {
  // Get all attendance records
  getAll: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    memberId?: string;
    organizationId?: string;
    serviceType?: string;
  }): Promise<AttendanceResponse> => {
    const queryString = params ? `?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]) as [string, string][])}` : '';
    return apiClient.get<AttendanceResponse>(`/attendance${queryString}`);
  },

  // Get attendance by ID
  getById: async (id: string): Promise<AttendanceResponse> => {
    return apiClient.get<AttendanceResponse>(`/attendance/${id}`);
  },

  // Mark attendance
  markAttendance: async (data: Partial<Attendance>): Promise<AttendanceResponse> => {
    return apiClient.post<AttendanceResponse>('/attendance', data);
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (records: Partial<Attendance>[]): Promise<AttendanceResponse> => {
    return apiClient.post<AttendanceResponse>('/attendance/bulk', { records });
  },

  // Update attendance
  update: async (id: string, data: Partial<Attendance>): Promise<AttendanceResponse> => {
    return apiClient.put<AttendanceResponse>(`/attendance/${id}`, data);
  },

  // Delete attendance
  delete: async (id: string): Promise<AttendanceResponse> => {
    return apiClient.delete<AttendanceResponse>(`/attendance/${id}`);
  },
};
