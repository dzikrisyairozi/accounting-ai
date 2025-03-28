import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QbAccountController } from '../controllers/account.controller';
import { QbAccountService } from '../services/account.service';
import { QuickbooksService } from '../quickbooks.service';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [QbAccountController],
  providers: [QbAccountService, QuickbooksService, PrismaService],
  exports: [QbAccountService],
})
export class QbAccountModule {} 