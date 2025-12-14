import { Request, Response, NextFunction } from 'express';
import { RegisterMemberUseCase } from '@domain/use-cases/RegisterMember';
import { 
  GetMembersUseCase, 
  GetMemberByIdUseCase, 
  UpdateMemberUseCase,
  PromoteFirstTimerUseCase,
  UpdateFollowUpNotesUseCase,
  DeleteMemberUseCase
} from '@domain/use-cases/MemberUseCases';
import { MemberRepository } from '@infrastructure/repositories/MemberRepository';

export class MemberController {
  private registerMemberUseCase: RegisterMemberUseCase;
  private getMembersUseCase: GetMembersUseCase;
  private getMemberByIdUseCase: GetMemberByIdUseCase;
  private updateMemberUseCase: UpdateMemberUseCase;
  private promoteFirstTimerUseCase: PromoteFirstTimerUseCase;
  private updateFollowUpNotesUseCase: UpdateFollowUpNotesUseCase;
  private deleteMemberUseCase: DeleteMemberUseCase;

  constructor() {
    const memberRepository = new MemberRepository();
    this.registerMemberUseCase = new RegisterMemberUseCase(memberRepository);
    this.getMembersUseCase = new GetMembersUseCase(memberRepository);
    this.getMemberByIdUseCase = new GetMemberByIdUseCase(memberRepository);
    this.updateMemberUseCase = new UpdateMemberUseCase(memberRepository);
    this.promoteFirstTimerUseCase = new PromoteFirstTimerUseCase(memberRepository);
    this.updateFollowUpNotesUseCase = new UpdateFollowUpNotesUseCase(memberRepository);
    this.deleteMemberUseCase = new DeleteMemberUseCase(memberRepository);
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await this.registerMemberUseCase.execute(req.body);

      res.status(201).json({
        message: 'Member registered successfully',
        member,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isFirstTimer, departmentId, levelId } = req.query;

      const filters: Record<string, unknown> = {};
      if (isFirstTimer !== undefined) {
        filters.isFirstTimer = isFirstTimer === 'true';
      }
      if (departmentId) {
        filters.departmentId = departmentId as string;
      }
      if (levelId) {
        filters.levelId = levelId as string;
      }

      const members = await this.getMembersUseCase.execute(filters);

      res.status(200).json({
        members,
        count: members.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const member = await this.getMemberByIdUseCase.execute(id);

      if (!member) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }

      res.status(200).json({ member });
    } catch (error) {
      next(error);
    }
  }

  async updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const member = await this.updateMemberUseCase.execute(id, req.body);

      res.status(200).json({
        message: 'Member updated successfully',
        member,
      });
    } catch (error) {
      next(error);
    }
  }

  async promoteFirstTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const member = await this.promoteFirstTimerUseCase.execute(id);

      res.status(200).json({
        message: 'First-timer promoted to member successfully',
        member,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFollowUpNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { followUpNotes } = req.body;

      if (!followUpNotes || typeof followUpNotes !== 'string') {
        res.status(400).json({ error: 'Follow-up notes are required' });
        return;
      }

      const member = await this.updateFollowUpNotesUseCase.execute(id, followUpNotes);

      res.status(200).json({
        message: 'Follow-up notes updated successfully',
        member,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteMemberUseCase.execute(id);

      res.status(200).json({
        message: 'Member deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
