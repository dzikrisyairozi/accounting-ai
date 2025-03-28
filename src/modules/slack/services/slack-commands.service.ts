import { Injectable, Logger } from '@nestjs/common';
import { QbAccountService } from '../../quickbooks/services/account.service';
import { SlackMessageWithBlocks } from '../interfaces/slack-message.interface';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAccountDto } from '../../quickbooks/dto/account.dto';

@Injectable()
export class SlackCommandsService {
  private readonly logger = new Logger(SlackCommandsService.name);

  constructor(
    private readonly qbAccountService: QbAccountService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handles the /finance accounts command
   * Fetches accounts from QuickBooks and formats them for Slack
   */
  async handleAccountsCommand(slackUserId: string): Promise<SlackMessageWithBlocks> {
    try {
      // Get user from database to find their QB connection
      const user = await this.prisma.user.findFirst({
        where: { slackId: slackUserId },
      });

      if (!user) {
        return {
          text: 'User not found',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'You need to connect your account first.',
              },
            },
          ],
        };
      }

      // Check if the user has a QuickBooks connection
      const qbConnection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId: user.id },
      });

      if (!qbConnection) {
        return {
          text: 'You need to connect to QuickBooks first',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'You need to connect your QuickBooks account first.',
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Connect QuickBooks',
                    emoji: true,
                  },
                  value: 'connect_quickbooks',
                  action_id: 'connect_quickbooks',
                  url: 'http://localhost:3000/quickbooks/connect', // Replace with your actual OAuth URL
                },
              ],
            },
          ],
        };
      }
      
      try {
        // Query accounts from QuickBooks
        const accountsData = await this.qbAccountService.queryAccounts(
          user.id,
          'select * from Account maxresults 20',  // Basic query to get accounts
        );

        if (!accountsData.QueryResponse || !accountsData.QueryResponse.Account || accountsData.QueryResponse.Account.length === 0) {
          return {
            text: 'No accounts found in QuickBooks',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: 'No accounts found in your QuickBooks company.',
                },
              },
            ],
          };
        }

        const accounts = accountsData.QueryResponse.Account;

        // Format accounts for Slack message
        let accountsList = '';
        accounts.forEach((account) => {
          accountsList += `• *${account.Name}* (${account.AccountType})${account.CurrentBalance ? ` - Balance: ${account.CurrentBalance} ${account.CurrencyRef?.value || 'USD'}` : ''}\n`;
        });

        return {
          text: 'Your QuickBooks Accounts',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Your QuickBooks Accounts',
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: accountsList,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Company: ${qbConnection.realmId} • Showing ${accounts.length} accounts`,
                },
              ],
            },
          ],
        };
      } catch (error) {
        this.logger.error('Error querying QuickBooks accounts', error);
        return {
          text: 'Error fetching accounts',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Error fetching accounts from QuickBooks: ${error.message}`,
              },
            },
          ],
        };
      }
    } catch (error) {
      this.logger.error('Error in handleAccountsCommand', error);
      return {
        text: 'Sorry, something went wrong',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Sorry, there was an error processing your request. Please try again later.',
            },
          },
        ],
      };
    }
  }

  /**
   * Handles the /finance create-account command
   * Provides a form for creating a new account in QuickBooks
   */
  createAccountFormResponse(): SlackMessageWithBlocks {
    return {
      text: 'Create a new QuickBooks account',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Create a New QuickBooks Account',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Use the following template to create a new account:',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '```\n/finance create-account {\n  "Name": "Account Name",\n  "AccountType": "Bank",\n  "AccountSubType": "Checking",\n  "Description": "Description here"\n}\n```',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available AccountTypes:*\nBank, Accounts Receivable, Other Current Asset, Fixed Asset, Other Asset, Accounts Payable, Credit Card, Other Current Liability, Long Term Liability, Equity, Income, Cost of Goods Sold, Expense, Other Income, Other Expense',
          },
        },
      ],
    };
  }

  /**
   * Creates a new account in QuickBooks
   */
  async createAccount(slackUserId: string, accountDataString: string): Promise<SlackMessageWithBlocks> {
    try {
      // Get user from database
      const user = await this.prisma.user.findFirst({
        where: { slackId: slackUserId },
      });

      if (!user) {
        return {
          text: 'User not found',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'You need to connect your account first.',
              },
            },
          ],
        };
      }

      // Check if the user has a QuickBooks connection
      const qbConnection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId: user.id },
      });

      if (!qbConnection) {
        return {
          text: 'You need to connect to QuickBooks first',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'You need to connect your QuickBooks account first.',
              },
            },
          ],
        };
      }

      // Parse account data from JSON string
      let parsedAccountData: CreateAccountDto;
      try {
        parsedAccountData = JSON.parse(accountDataString) as CreateAccountDto;
      } catch (e) {
        return {
          text: 'Invalid account data format',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'The account data provided is not valid JSON. Please check the format and try again.',
              },
            },
          ],
        };
      }
      
      try {
        // Create account in QuickBooks
        const result = await this.qbAccountService.createAccount(
          user.id,
          parsedAccountData,
        );

        // Extract the account from the response
        const createdAccount = result.Account;

        return {
          text: 'Account created successfully',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Account Created Successfully',
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Name:* ${createdAccount.Name}\n*Type:* ${createdAccount.AccountType}\n*Sub Type:* ${createdAccount.AccountSubType || 'N/A'}\n*ID:* ${createdAccount.Id}`,
              },
            },
          ],
        };
      } catch (error) {
        this.logger.error('Error creating QuickBooks account', error);
        return {
          text: 'Error creating account',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Error creating account in QuickBooks: ${error.message}`,
              },
            },
          ],
        };
      }
    } catch (error) {
      this.logger.error('Error in createAccount', error);
      return {
        text: 'Sorry, something went wrong',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Sorry, there was an error processing your request. Please try again later.',
            },
          },
        ],
      };
    }
  }
} 