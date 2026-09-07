import { NextFunction, Request, Response } from 'express';
import { DealersService } from './dealers.service';
const service = new DealersService();
export class DealersController {
  list = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.list() }); } catch (e) { next(e); } };
  mine = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getMine(req.user!.userId) }); } catch (e) { next(e); } };
  update = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: 'Dealer profile updated.', data: await service.updateMine(req.user!.userId, req.body) }); } catch (e) { next(e); } };
}
