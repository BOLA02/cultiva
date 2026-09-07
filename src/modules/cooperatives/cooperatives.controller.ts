import { NextFunction, Request, Response } from 'express'; import { CooperativesService } from './cooperatives.service'; const service = new CooperativesService();
export class CooperativesController {
  list = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.list() }); } catch(e) { next(e); } };
  mine = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.mine(req.user!.userId) }); } catch(e) { next(e); } };
  update = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: 'Cooperative profile updated.', data: await service.update(req.user!.userId, req.body) }); } catch(e) { next(e); } };
}
