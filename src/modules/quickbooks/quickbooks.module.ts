import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QuickbooksService } from './quickbooks.service';
import { QuickbooksController } from './quickbooks.controller';
import { PrismaService } from '../../database/prisma.service';
import { QbAccountModule } from './modules/account.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    QbAccountModule,
  ],
  controllers: [QuickbooksController],
  providers: [QuickbooksService, PrismaService],
  exports: [QuickbooksService],
})
export class QuickbooksModule {}
