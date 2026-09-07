import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput, AuthResponse, ProfileFieldName } from './auth.types';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { UserRole, UserStatus } from '@prisma/client';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingEmail = await this.authRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new AppError('An account with this email address already exists.', HttpStatus.CONFLICT);
    }

    const existingPhone = await this.authRepository.findByPhone(input.phone);
    if (existingPhone) {
      throw new AppError('An account with this phone number already exists.', HttpStatus.CONFLICT);
    }

    const hashedPassword = await hashPassword(input.password);

    let profileFieldName: ProfileFieldName;
    let profileData: any = {};

    switch (input.role) {
      case UserRole.FARMER:
        profileFieldName = 'farmerProfile';
        profileData = { nin: input.nin || null, farmSizeHectares: 0, experienceYears: 0 };
        break;
      case UserRole.BUYER:
        profileFieldName = 'buyerProfile';
        profileData = { companyName: input.companyName || null, businessTin: input.businessTin || null };
        break;
      case UserRole.TRANSPORTER:
        profileFieldName = 'transporterProfile';
        profileData = { licenseNumber: input.licenseNumber || null, vehicleType: null, maxCapacityKg: 0 };
        break;
      case UserRole.DEALER:
        profileFieldName = 'dealerProfile';
        profileData = {
          storeName: input.storeName || 'My Agro-Shop',
          physicalAddress: input.physicalAddress || 'Pending Setup',
        };
        break;
      case UserRole.COOPERATIVE:
        profileFieldName = 'cooperativeProfile';
        profileData = {
          registrationNo: input.registrationNo || `COP-${Date.now()}`,
          memberCount: 1,
          operatingRegion: input.operatingRegion || 'Pending',
        };
        break;
      default:
        throw new AppError('Invalid registration role assignment.', HttpStatus.BAD_REQUEST);
    }

    const userData = {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: hashedPassword,
      role: input.role,
    };

    const user = await this.authRepository.createUserWithProfile(userData, profileFieldName, profileData);
    const { password, ...safeUser } = user;

    const token = generateToken({ userId: user.id, role: user.role });

    return { user: safeUser, token };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid email or password credentials provided.', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password credentials provided.', HttpStatus.UNAUTHORIZED);
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(
        'Your Cultiva account has been suspended. Please contact platform support.',
        HttpStatus.FORBIDDEN
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new AppError('Your account is inactive. Please contact platform support.', HttpStatus.FORBIDDEN);
    }

    const { password, ...safeUser } = user;
    const token = generateToken({ userId: user.id, role: user.role });

    return { user: safeUser, token };
  }

  async getCurrentUser(userId: string): Promise<AuthResponse['user']> {
  const user = await this.authRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found.', HttpStatus.NOT_FOUND);
  }

  const { password, ...safeUser } = user;
  return safeUser;
}
}