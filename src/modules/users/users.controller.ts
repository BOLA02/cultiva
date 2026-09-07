import { NextFunction, Request, Response } from 'express';
import { UsersService } from './users.service';

const service = new UsersService();
export class UsersController {
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await service.getPublicProfile(req.params.id as string) }); } catch (e) { next(e); }
  };
  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, message: 'Profile updated successfully.', data: await service.updateMe(req.user!.userId, req.body) }); } catch (e) { next(e); }
  };
}
