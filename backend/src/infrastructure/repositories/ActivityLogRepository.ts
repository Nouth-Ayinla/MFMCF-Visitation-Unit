import { IActivityLogRepository } from '@domain/repositories/IActivityLogRepository';
import { ActivityLog, ActivityLogFilters } from '@domain/entities/ActivityLog';
import { ActivityLogModel } from '../database/models/ActivityLogModel';
import { UserModel } from '../database/models/UserModel';

export class ActivityLogRepository implements IActivityLogRepository {
  async findAll(filters?: ActivityLogFilters): Promise<ActivityLog[]> {
    const query: Record<string, unknown> = {};

    if (filters?.userId) {
      query.userId = filters.userId;
    }

    if (filters?.action) {
      query.action = filters.action;
    }

    if (filters?.entityType) {
      query.entityType = filters.entityType;
    }

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        (query.createdAt as Record<string, unknown>).$gte = filters.startDate;
      }
      if (filters.endDate) {
        (query.createdAt as Record<string, unknown>).$lte = filters.endDate;
      }
    }

    const limit = filters?.limit || 50;

    const logs = await ActivityLogModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch user details for each log
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const user = await UserModel.findById(log.userId).lean();
        const performer = log.performedBy 
          ? await UserModel.findById(log.performedBy).lean()
          : null;

        return this.mapToEntity(log, user, performer);
      })
    );

    return enrichedLogs;
  }

  async create(logData: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const log = await ActivityLogModel.create({
      userId: logData.userId,
      performedBy: logData.performedBy,
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId,
      oldData: logData.oldData,
      newData: logData.newData,
    });

    const user = await UserModel.findById(log.userId).lean();
    const performer = log.performedBy 
      ? await UserModel.findById(log.performedBy).lean()
      : null;

    return this.mapToEntity({ ...log.toObject(), _id: log._id }, user, performer);
  }

  private mapToEntity(
    doc: Record<string, unknown> & { _id: { toString(): string } },
    user: Record<string, unknown> | null,
    performer: Record<string, unknown> | null
  ): ActivityLog {
    return {
      id: doc._id.toString(),
      userId: (doc.userId as { toString(): string }).toString(),
      performedBy: (doc.performedBy as { toString(): string } | undefined)?.toString(),
      action: doc.action as string,
      entityType: doc.entityType as string,
      entityId: doc.entityId as string | undefined,
      oldData: doc.oldData as Record<string, unknown> | undefined,
      newData: doc.newData as Record<string, unknown> | undefined,
      createdAt: doc.createdAt as Date,
      userEmail: user?.email as string | undefined,
      userName: user?.fullName as string | undefined,
      performerEmail: performer?.email as string | undefined,
      performerName: performer?.fullName as string | undefined,
    };
  }
}
