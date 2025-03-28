import { Module, OnModuleInit, MiddlewareConsumer, NestModule, forwardRef } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BoltService } from './services/bolt.service';
import { SlackCommandsService } from './services/slack-commands.service';
import { SlackOAuthService } from './services/oauth.service';
import { SlackController } from './controllers/slack.controller';
import { SlackOAuthController } from './controllers/oauth.controller';
import { PrismaService } from '../../database/prisma.service';
import { QuickbooksModule } from '../quickbooks/quickbooks.module';
import { QbAccountModule } from '../quickbooks/modules/account.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    forwardRef(() => QuickbooksModule),
    forwardRef(() => QbAccountModule),
  ],
  controllers: [SlackController, SlackOAuthController],
  providers: [
    BoltService,
    SlackCommandsService,
    SlackOAuthService,
    PrismaService,
  ],
  exports: [BoltService, SlackCommandsService, SlackOAuthService],
})
export class SlackModule implements OnModuleInit, NestModule {
  constructor(private readonly boltService: BoltService) {}

  async onModuleInit() {
    // Any additional setup for the Slack module
  }

  configure(consumer: MiddlewareConsumer) {
    // Register the Bolt middleware for handling Slack events
    consumer
      .apply((req, res, next) => {
        // Check if this is a request to the Slack events endpoint
        if (req.path.startsWith('/slack/events')) {
          // Use the Bolt router to handle the request
          return this.boltService.getRouter()(req, res, next);
        }
        return next();
      })
      .forRoutes('slack/events');
  }
} 