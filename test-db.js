// Quick test script to check if database operations work
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDB() {
  try {
    console.log('Testing database connection...');

    // List all budgets
    const budgets = await prisma.budget.findMany({
      include: {
        user: true,
      },
    });

    console.log(`Found ${budgets.length} budgets in database:`);
    budgets.forEach(budget => {
      console.log(`- User ID: ${budget.userId}, Year: ${budget.year}, Month: ${budget.month}`);
    });

    // List all profiles
    const profiles = await prisma.profile.findMany();
    console.log(`\nFound ${profiles.length} profiles in database:`);
    profiles.forEach(profile => {
      console.log(`- Profile ID: ${profile.id}, User ID: ${profile.userId}`);
    });

  } catch (error) {
    console.error('Error testing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
