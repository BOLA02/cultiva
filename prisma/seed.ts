import 'dotenv/config';
import { UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../src/config/db';
import { hashPassword } from '../src/utils/hash';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running the admin seed.');
}

const firstName = process.env.ADMIN_FIRST_NAME || 'Cultiva';
const lastName = process.env.ADMIN_LAST_NAME || 'Administrator';
const phone = process.env.ADMIN_PHONE || '+2340000000000';

async function main() {
  const hashedPassword = await hashPassword(password);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      firstName, lastName, phone, password: hashedPassword,
      role: UserRole.ADMIN, status: UserStatus.ACTIVE,
      isVerified: true, verificationStatus: VerificationStatus.VERIFIED,
    },
    create: {
      firstName, lastName, email, phone, password: hashedPassword,
      role: UserRole.ADMIN, status: UserStatus.ACTIVE,
      isVerified: true, verificationStatus: VerificationStatus.VERIFIED,
    },
  });
  console.log(`Administrator ready: ${admin.email}`);
}

main().finally(() => prisma.$disconnect());
