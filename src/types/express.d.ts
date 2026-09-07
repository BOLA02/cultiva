import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
