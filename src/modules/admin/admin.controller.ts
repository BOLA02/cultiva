import { NextFunction, Request, Response } from 'express';
import { FarmStatus } from '@prisma/client';
import { AdminService } from './admin.service';

const service = new AdminService();
const pagination = (req: Request) => {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20,
  };
};

export class AdminController {
  users = async (req: Request, res: Response, next: NextFunction) => { try { const { page, limit } = pagination(req); const result = await service.users(page, limit); res.json({ success: true, ...result }); } catch (e) { next(e); } };
  farms = async (req: Request, res: Response, next: NextFunction) => { try { const { page, limit } = pagination(req); const result = await service.farms(page, limit, req.query.status as FarmStatus | undefined); res.json({ success: true, ...result }); } catch (e) { next(e); } };
  status = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: 'User status updated.', data: await service.setUserStatus(req.user!.userId, req.params.id as string, req.body.status) }); } catch (e) { next(e); } };
  verify = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: 'Verification updated.', data: await service.verifyUser(req.user!.userId, req.params.id as string, req.body.verificationStatus) }); } catch (e) { next(e); } };
  farm = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: 'Farm status updated.', data: await service.setFarmStatus(req.user!.userId, req.params.id as string, req.body.status) }); } catch (e) { next(e); } };
  logs = async (req: Request, res: Response, next: NextFunction) => { try { const { page, limit } = pagination(req); res.json({ success: true, data: await service.logs(page, limit) }); } catch (e) { next(e); } };
}
