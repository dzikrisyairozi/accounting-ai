import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, ExpressReceiver, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { PrismaService } from '../../../database/prisma.service';
import { QuickbooksService } from '../../quickbooks/quickbooks.service';
import { SlackMessageWithBlocks } from '../interfaces/slack-message.interface';
import { SlackCommandsService } from './slack-commands.service';

@Injectable()
export class BoltService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BoltService.name);
  private app: App;
  private webClient: WebClient;
  private receiver: ExpressReceiver;
  private isInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly quickbooksService: QuickbooksService,
    private readonly slackCommandsService: SlackCommandsService,
  ) {
    // Initialize the ExpressReceiver
    this.receiver = new ExpressReceiver({
      signingSecret: this.configService.get<string>('SLACK_SIGNING_SECRET'),
      processBeforeResponse: true,
    });

    // Get the token from configuration
    const token = this.configService.get<string>('SLACK_BOT_TOKEN');

    // Only initialize Bolt and WebClient if we have a token
    if (token) {
      this.initializeWithToken(token);
    } else {
      this.logger.warn('SLACK_BOT_TOKEN not set. Bolt app is partially initialized. Some features will be disabled until a token is provided.');
    }
  }

  private initializeWithToken(token: string) {
    try {
      // Initialize the Bolt app with the receiver
      this.app = new App({
        token,
        receiver: this.receiver,
        logLevel: LogLevel.DEBUG,
      });

      // Initialize WebClient for additional API calls
      this.webClient = new WebClient(token);

      // Set up listeners and handlers
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.logger.log('Bolt app fully initialized with token');
    } catch (error) {
      this.logger.error('Error initializing Bolt app with token', error);
    }
  }

  async onModuleInit() {
    // Setup is now handled in the constructor or via initializeWithToken
    this.logger.log('Bolt service module initialized');
  }

  async onModuleDestroy() {
    // Nothing to clean up for Bolt, as it uses the NestJS server
    this.logger.log('Bolt app shutdown');
  }

  // Get the Express router to be used in the NestJS app
  public getRouter() {
    return this.receiver.router;
  }

  // Method to update the token if it changes (like after OAuth)
  public updateToken(token: string) {
    this.logger.log('Updating Bolt app with new token');
    this.initializeWithToken(token);
  }

  private setupEventListeners() {
    if (!this.isInitialized || !this.app) {
      this.logger.warn('Cannot set up event listeners: Bolt app not fully initialized');
      return;
    }

    // Listen for messages (direct messages or in channels where the bot is mentioned)
    this.app.message(async ({ message, say }) => {
      try {
        // Ignore bot messages and messages in threads
        // @ts-ignore - We need to ignore because message type can vary
        if (message.subtype === undefined && message.thread_ts === undefined) {
          // @ts-ignore - message.text can exist but TypeScript doesn't know
          const text = message.text?.toLowerCase() || '';
          
          // Simple keyword detection
          if (text.includes('account') || text.includes('finance') || text.includes('quickbooks')) {
            await this.handleFinanceQuery(say, message);
          }
        }
      } catch (error) {
        this.logger.error('Error handling message', error);
      }
    });

    // Listen for app mentions
    this.app.event('app_mention', async ({ event, say }) => {
      try {
        await say(`Hi <@${event.user}>! How can I help you with your finances today?`);
      } catch (error) {
        this.logger.error('Error handling app mention', error);
      }
    });

    // Listen for slash commands
    this.app.command('/finance', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        const commandText = command.text.toLowerCase();
        
        if (commandText.includes('accounts')) {
          await respond('I\'ll get your accounts for you. One moment please...');
          
          // Use the SlackCommandsService to handle the accounts command
          const response = await this.slackCommandsService.handleAccountsCommand(command.user_id);
          await respond(response);
        } else if (commandText.startsWith('create-account')) {
          // Check if there's data after the command
          const accountData = command.text.substring('create-account'.length).trim();
          
          if (!accountData) {
            // No account data provided, show the form
            await respond(this.slackCommandsService.createAccountFormResponse());
          } else {
            // Account data provided, try to create the account
            await respond('Creating your account. One moment please...');
            const response = await this.slackCommandsService.createAccount(command.user_id, accountData);
            await respond(response);
          }
        } else {
          await respond({
            text: 'How can I help you with your finances?',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: 'Here are some commands you can try:',
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '• `/finance accounts` - List your accounts\n• `/finance create-account` - Create a new account\n• `/finance pnl` - Get profit & loss report',
                },
              },
            ],
          });
        }
      } catch (error) {
        this.logger.error('Error handling finance command', error);
        await respond('Sorry, something went wrong. Please try again later.');
      }
    });

    // Listen for interactive components (buttons, etc.)
    this.app.action('view_accounts', async ({ body, ack, respond }) => {
      await ack();
      
      try {
        await respond('Getting your accounts...');
        // Get the user ID from the body
        const userId = body.user.id;
        const response = await this.slackCommandsService.handleAccountsCommand(userId);
        await respond(response);
      } catch (error) {
        this.logger.error('Error handling view accounts action', error);
        await respond('Sorry, something went wrong. Please try again later.');
      }
    });

    this.app.action('check_pnl', async ({ body, ack, respond }) => {
      await ack();
      
      try {
        await respond('This feature is coming soon! We\'re working on integrating profit and loss reports.');
      } catch (error) {
        this.logger.error('Error handling check P&L action', error);
      }
    });
  }

  // Helper method to find or create a user by Slack ID
  private async findOrCreateUserBySlackId(slackId: string) {
    if (!this.isInitialized || !this.webClient) {
      throw new Error('Cannot find or create user: WebClient not initialized');
    }

    try {
      // Look for existing user
      let user = await this.prisma.user.findFirst({
        where: { slackId },
      });

      // Create a new user if none exists
      if (!user) {
        // Get user info from Slack
        const userInfo = await this.webClient.users.info({
          user: slackId,
        });

        // Create user in our database
        user = await this.prisma.user.create({
          data: {
            slackId,
            email: `slack-${slackId}@example.com`, // Placeholder email
            name: userInfo.user.real_name || `Slack User ${slackId}`,
          },
        });

        this.logger.log(`Created new user for Slack ID: ${slackId}`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding/creating user for Slack ID: ${slackId}`, error);
      throw error;
    }
  }

  // Helper method to handle finance-related queries
  private async handleFinanceQuery(say: Function, message: any) {
    const response: SlackMessageWithBlocks = {
      text: 'I can help you with your finances',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hi <@${message.user}>! I noticed you mentioned something about finances. I can help with:`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• QuickBooks account information\n• Profit and loss analysis\n• Financial insights and summaries',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Accounts',
                emoji: true,
              },
              value: 'view_accounts',
              action_id: 'view_accounts',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Check P&L',
                emoji: true,
              },
              value: 'check_pnl',
              action_id: 'check_pnl',
            },
          ],
        },
      ],
    };

    await say(response);
  }

  // Public method to send a message to a channel
  public async sendMessage(channel: string, text: string, blocks?: any[]) {
    if (!this.isInitialized || !this.webClient) {
      throw new Error('Cannot send message: WebClient not initialized');
    }

    try {
      await this.webClient.chat.postMessage({
        channel,
        text,
        blocks,
      });
    } catch (error) {
      this.logger.error(`Error sending message to channel ${channel}`, error);
      throw error;
    }
  }
} 