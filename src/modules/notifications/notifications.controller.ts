import { NextFunction, Request, Response } from 'express'; import { NotificationsService } from './notifications.service'; const service = new NotificationsService();
export class NotificationsController {
  list = async (req: Request, res: Response, next: NextFunction) => { try { const result = await service.list(req.user!.userId, req.query as any); res.json({ success: true, ...result }); } catch(e) { next(e); } };
  read = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.markRead(req.user!.userId, req.params.id as string) }); } catch(e) { next(e); } };
  readAll = async (req: Request, res: Response, next: NextFunction) => { try { const result = await service.markAllRead(req.user!.userId); res.json({ success: true, message: 'Notifications marked as read.', data: { updated: result.count } }); } catch(e) { next(e); } };
  remove = async (req: Request, res: Response, next: NextFunction) => { try { await service.remove(req.user!.userId, req.params.id as string); res.status(204).send(); } catch(e) { next(e); } };
}
