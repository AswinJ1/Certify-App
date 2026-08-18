import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if SUPER_ADMIN already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (existingAdmin) {
    console.log('✅ SUPER_ADMIN already exists:', existingAdmin.email);
    return;
  }

  // Create SUPER_ADMIN
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@certify.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ SUPER_ADMIN created:', admin.email);
  console.log('   Password: admin123');
  console.log('   (Change this in production!)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
