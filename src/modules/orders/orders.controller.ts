import { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service';

export class OrdersController {
  private ordersService: OrdersService;

  constructor() {
    this.ordersService = new OrdersService();
  }

  /**
   * HTTP Handler: POST /api/v1/orders
   */
  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const order = await this.ordersService.placeOrder(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully.',
        data: order,
      });
    } catch (error: any) {
      next(error);
    }
  };

  // add to orders.controller.ts

acceptOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const order = await this.ordersService.acceptOrder(userId, id, req.body?.transportPrice);

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully.',
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

rejectOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await this.ordersService.rejectOrder(req.user!.userId, req.params.id as string, req.body.reason);
    res.status(200).json({ success: true, message: 'Order rejected successfully.', data: order });
  } catch (error: any) { next(error); }
};

processOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const order = await this.ordersService.processOrder(userId, id);

    res.status(200).json({
      success: true,
      message: 'Order moved to processing.',
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const order = await this.ordersService.cancelOrder(userId, id);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

listMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const orders = await this.ordersService.listMyOrders(userId, role);
    res.status(200).json({ success: true, message: 'Orders retrieved successfully.', data: orders });
  } catch (error: any) {
    next(error);
  }
};
}
