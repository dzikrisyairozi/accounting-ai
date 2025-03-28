/**
 * This script tests the QuickBooks API integration
 * Run it with: npx ts-node src/test-quickbooks.ts
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { QuickbooksService } from './modules/quickbooks/quickbooks.service';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const logger = new Logger('TestQuickbooks');
  logger.log('Starting QuickBooks API test...');

  // Create a NestJS application
  const app = await NestFactory.create(AppModule);
  const quickbooksService = app.get(QuickbooksService);
  const prisma = app.get(PrismaService);

  try {
    // Check if we have a test user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      logger.log('Creating test user...');
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    }

    // Generate authorization URL
    const state = 'test-state';
    const authUrl = quickbooksService.getAuthorizationUrl(state);

    logger.log('To connect to QuickBooks, open this URL in your browser:');
    logger.log(authUrl);
    logger.log("\nAfter authorization, you'll be redirected to the callback URL.");
    logger.log('You can then test the P&L endpoint at: http://localhost:3000/quickbooks/pnl');
  } catch (error) {
    logger.error('Error testing QuickBooks API', error);
  } finally {
    await app.close();
  }
}

bootstrap();
