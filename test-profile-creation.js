const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:redsyx-zatmix-9miJja@db.svoylgtrnvlbvcufcksx.supabase.co:5432/postgres"
    }
  }
});

async function testProfileCreation() {
  try {
    // Test with a valid UUID
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';

    console.log('Testing profile creation with userId:', testUserId);

    const profile = await prisma.profile.upsert({
      where: { userId: testUserId },
      update: {},
      create: { userId: testUserId },
    });

    console.log('✅ Profile created successfully:', profile);

    // Clean up
    await prisma.profile.delete({ where: { userId: testUserId } });
    console.log('✅ Test cleanup completed');

  } catch (error) {
    console.error('❌ Error creating profile:', error);
    console.error('Error message:', error.message);
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProfileCreation();
