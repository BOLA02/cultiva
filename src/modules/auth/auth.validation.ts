import { z } from 'zod';
import { UserRole } from '@prisma/client';

const publicRegisterableRoles = z.enum(UserRole).exclude([UserRole.ADMIN]);

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address format'),
    phone: z.string().min(10, 'Phone number must be valid'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: publicRegisterableRoles,
    nin: z.string().optional(),
    companyName: z.string().optional(),
    businessTin: z.string().optional(),
    licenseNumber: z.string().optional(),
    storeName: z.string().optional(),
    physicalAddress: z.string().optional(),
    registrationNo: z.string().optional(),
    operatingRegion: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password field cannot be empty'),
  }),
});