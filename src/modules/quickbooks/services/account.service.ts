import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../database/prisma.service';
import { QuickbooksService } from '../quickbooks.service';
import { CreateAccountDto } from '../dto/account.dto';

@Injectable()
export class QbAccountService {
  private readonly logger = new Logger(QbAccountService.name);
  private readonly baseUrl = 'https://sandbox-quickbooks.api.intuit.com/v3/company';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly quickbooksService: QuickbooksService,
  ) {}

  /**
   * Create a QuickBooks account
   */
  async createAccount(userId: string, accountData: CreateAccountDto) {
    try {
      // Get the valid access token and connection
      const accessToken = await this.quickbooksService.getValidAccessToken(userId);
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId },
      });

      if (!connection) {
        throw new Error('QuickBooks connection not found');
      }

      this.logger.log(`Creating QuickBooks account for company ${connection.realmId}`);

      // Make the API call to create the account
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${connection.realmId}/account`,
          accountData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Account created successfully with ID: ${response.data.Account.Id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Error creating QuickBooks account', error);
      if (error.response) {
        this.logger.error('Response data:', error.response.data);
        this.logger.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * Get a QuickBooks account by ID
   */
  async getAccount(userId: string, accountId: string) {
    try {
      // Get the valid access token and connection
      const accessToken = await this.quickbooksService.getValidAccessToken(userId);
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId },
      });

      if (!connection) {
        throw new Error('QuickBooks connection not found');
      }

      this.logger.log(`Getting QuickBooks account ${accountId} for company ${connection.realmId}`);

      // Make the API call to get the account
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${connection.realmId}/account/${accountId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting QuickBooks account ${accountId}`, error);
      if (error.response) {
        this.logger.error('Response data:', error.response.data);
        this.logger.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * Query QuickBooks accounts
   */
  async queryAccounts(userId: string, query?: string) {
    try {
      // Get the valid access token and connection
      const accessToken = await this.quickbooksService.getValidAccessToken(userId);
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId },
      });

      if (!connection) {
        throw new Error('QuickBooks connection not found');
      }

      // Default query to select all accounts
      const queryString = query || 'SELECT * FROM Account';
      this.logger.log(`Querying QuickBooks accounts for company ${connection.realmId}: ${queryString}`);

      // Make the API call to query accounts
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${connection.realmId}/query?query=${encodeURIComponent(queryString)}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error querying QuickBooks accounts', error);
      if (error.response) {
        this.logger.error('Response data:', error.response.data);
        this.logger.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * Update a QuickBooks account
   */
  async updateAccount(userId: string, accountId: string, syncToken: string, accountData: Partial<CreateAccountDto>) {
    try {
      // Get the valid access token and connection
      const accessToken = await this.quickbooksService.getValidAccessToken(userId);
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId },
      });

      if (!connection) {
        throw new Error('QuickBooks connection not found');
      }

      this.logger.log(`Updating QuickBooks account ${accountId} for company ${connection.realmId}`);

      // Prepare the update data
      const updateData = {
        ...accountData,
        Id: accountId,
        SyncToken: syncToken,
      };

      // Make the API call to update the account
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${connection.realmId}/account`,
          updateData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Account updated successfully: ${accountId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error updating QuickBooks account ${accountId}`, error);
      if (error.response) {
        this.logger.error('Response data:', error.response.data);
        this.logger.error('Response status:', error.response.status);
      }
      throw error;
    }
  }
} 