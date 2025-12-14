export interface ActivityLog {
  id: string;
  userId: string;
  performedBy?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  createdAt: Date;
  userEmail?: string;
  userName?: string;
  performerEmail?: string;
  performerName?: string;
}

export interface ActivityLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}
