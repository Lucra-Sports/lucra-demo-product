import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test users
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'test123',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      birthday: '1990-01-01',
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      fullName: 'Demo User',
      email: 'demo@example.com',
      password: 'demo123',
      address: '456 Demo Avenue',
      city: 'Demo City',
      state: 'DM',
      zipCode: '67890',
      birthday: '1985-05-15',
    },
  });

  // Create some sample numbers for the test user
  await prisma.number.createMany({
    data: [
      {
        userId: testUser.id,
        value: 7843,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        userId: testUser.id,
        value: 2156,
        createdAt: new Date('2024-01-15T11:45:00Z'),
      },
      {
        userId: testUser.id,
        value: 9234,
        createdAt: new Date('2024-01-15T14:20:00Z'),
      },
      {
        userId: demoUser.id,
        value: 5671,
        createdAt: new Date('2024-01-16T09:15:00Z'),
      },
      {
        userId: demoUser.id,
        value: 8432,
        createdAt: new Date('2024-01-16T16:30:00Z'),
      },
    ],
  });

  // Create some sample user bindings
  await prisma.userBinding.createMany({
    data: [
      {
        userId: testUser.id,
        externalId: 'oauth_test_12345',
        type: 'oauth_provider',
      },
      {
        userId: testUser.id,
        externalId: 'stripe_cus_test123',
        type: 'payment_provider',
      },
      {
        userId: demoUser.id,
        externalId: 'api_demo_67890',
        type: 'external_api',
      },
      {
        userId: demoUser.id,
        externalId: 'paypal_demo_abc',
        type: 'payment_provider',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`👤 Created users: ${testUser.email}, ${demoUser.email}`);
  console.log('🎲 Created sample numbers for both users');
  console.log('🔗 Created sample user bindings');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
