import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days, in milliseconds — matches JWT_EXPIRES_IN

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: { user: result.user },
      });
    } catch (error: any) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        data: { user: result.user },
      });
    } catch (error: any) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await this.authService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      message: 'Current user retrieved.',
      data: { user },
    });
  } catch (error: any) {
    next(error);
  }
};
}