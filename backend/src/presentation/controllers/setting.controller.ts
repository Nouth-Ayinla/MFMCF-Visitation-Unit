import { Request, Response, NextFunction } from 'express';
import { GetSettingsUseCase, UpdateSettingsUseCase } from '@domain/use-cases/SettingUseCases';
import { SettingRepository } from '@infrastructure/repositories/SettingRepository';
import { SettingUpdate } from '@domain/entities/Setting';

export class SettingController {
  private getSettingsUseCase: GetSettingsUseCase;
  private updateSettingsUseCase: UpdateSettingsUseCase;

  constructor() {
    const settingRepository = new SettingRepository();
    this.getSettingsUseCase = new GetSettingsUseCase(settingRepository);
    this.updateSettingsUseCase = new UpdateSettingsUseCase(settingRepository);
  }

  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await this.getSettingsUseCase.execute();

      res.status(200).json({
        settings,
        count: settings.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updates: SettingUpdate[] = req.body.settings;
      const userId = (req as Request & { userId: string }).userId;

      if (!updates || !Array.isArray(updates)) {
        res.status(400).json({ error: 'Settings array is required' });
        return;
      }

      // Add updatedBy to each update
      const updatesWithUser = updates.map(update => ({
        ...update,
        updatedBy: userId,
      }));

      const updatedSettings = await this.updateSettingsUseCase.execute(updatesWithUser);

      res.status(200).json({
        message: 'Settings updated successfully',
        settings: updatedSettings,
      });
    } catch (error) {
      next(error);
    }
  }
}
