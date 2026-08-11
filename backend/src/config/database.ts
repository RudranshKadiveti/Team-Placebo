import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Perform simple light ping query
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error instanceof Error ? error.message : error);
    return false;
  }
}
