import { Request, Response, NextFunction } from 'express';
import { RegisterMemberUseCase } from '@domain/use-cases/RegisterMember';
import { MemberRepository } from '@infrastructure/repositories/MemberRepository';

export class MemberController {
  private registerMemberUseCase: RegisterMemberUseCase;

  constructor() {
    const memberRepository = new MemberRepository();
    this.registerMemberUseCase = new RegisterMemberUseCase(memberRepository);
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
}
