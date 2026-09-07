import { User, UserRole } from '@prisma/client';

export type ProfileFieldName =
  | 'farmerProfile'
  | 'buyerProfile'
  | 'transporterProfile'
  | 'dealerProfile'
  | 'cooperativeProfile';

export type SafeUser = Omit<User, 'password'>;

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  nin?: string;
  companyName?: string;
  businessTin?: string;
  licenseNumber?: string;
  storeName?: string;
  physicalAddress?: string;
  registrationNo?: string;
  operatingRegion?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
}