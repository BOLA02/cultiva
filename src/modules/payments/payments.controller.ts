import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';

export class PaymentsController {
  private paymentsService: PaymentsService;

  constructor() {
    this.paymentsService = new PaymentsService();
  }

  /**
   * HTTP Handler: POST /api/v1/orders/:orderId/payments/initiate
   */
  initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const orderId = req.params.orderId as string;

      const result = await this.paymentsService.initiatePayment(userId, orderId, req.body.method);

      res.status(201).json({
        success: true,
        message: 'Payment initiated. Redirect the buyer to the checkout URL.',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  };

  verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentsService.verifyPayment(req.user!.userId, req.params.reference as string);
      res.json({ success: true, message: 'Payment verified.', data: payment });
    } catch (error) { next(error); }
  };

  /**
   * HTTP Handler: POST /api/v1/payments/webhook
   * Called by the payment gateway, not a browser client.
   */
  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['x-paystack-signature'] as string | undefined;
      const rawBody = req.rawBody || JSON.stringify(req.body);

      await this.paymentsService.handleWebhook(rawBody, signature, req.body);

      // Gateways expect a fast 200 acknowledging receipt — respond
      // minimally, they don't parse or care about response content.
      res.status(200).json({ received: true });
    } catch (error: any) {
      next(error);
    }
  };
}
