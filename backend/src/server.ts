import app from './app';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    logger.info('Connecting to the database...');
    // Attempt database check
    await prisma.$connect();
    logger.info('Database connection established successfully.');

    app.listen(PORT, () => {
      logger.info(`VendorBridge API server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    logger.error('Database connection failed. Proceeding with database offline (some endpoints will fail)', error);
    // Run server anyway so health checks/mocks can operate or user can start DB later
    app.listen(PORT, () => {
      logger.info(`VendorBridge API server is running on port ${PORT} (Prisma Offline Mode).`);
    });
  }
}

bootstrap();
