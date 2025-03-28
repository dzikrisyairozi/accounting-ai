import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as querystring from 'querystring';

@Injectable()
export class QuickbooksService {
  private readonly logger = new Logger(QuickbooksService.name);
  private readonly baseUrl = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
  private readonly oauthBaseUrl = 'https://oauth.platform.intuit.com/oauth2/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate the authorization URL for QuickBooks OAuth
   */
  getAuthorizationUrl(state: string): string {
    const clientId = this.configService.get<string>('QUICKBOOKS_CLIENT_ID');
    const redirectUri = this.configService.get<string>('QUICKBOOKS_REDIRECT_URI');

    const params = {
      client_id: clientId,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: redirectUri,
      state,
    };

    return `${this.oauthBaseUrl}/authorize?${querystring.stringify(params)}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    realmId: string;
  }> {
    const clientId = this.configService.get<string>('QUICKBOOKS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('QUICKBOOKS_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('QUICKBOOKS_REDIRECT_URI');

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.oauthBaseUrl}/token`,
          querystring.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
          },
        ),
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        realmId: response.data.realmId,
      };
    } catch (error) {
      this.logger.error('Error exchanging authorization code for tokens', error);
      throw error;
    }
  }

  /**
   * Refresh the access token
   */
  async refreshToken(userId: string): Promise<string> {
    try {
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId },
      });

      if (!connection) {
        throw new Error('QuickBooks connection not found');
      }

      const clientId = this.configService.get<string>('QUICKBOOKS_CLIENT_ID');
      const clientSecret = this.configService.get<string>('QUICKBOOKS_CLIENT_SECRET');

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.oauthBaseUrl}/token`,
          querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: connection.refreshToken,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
          },
        ),
      );

      // Update tokens in database
      await this.prisma.quickBooksConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
        },
      });

      return response.data.access_token;
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      throw error;
    }
  }

  /**
   * Get profit and loss report
   */
  async getProfitAndLoss(userId: string, startDate: string, endDate: string) {
    const accessToken = await this.getValidAccessToken(userId);
    const connection = await this.prisma.quickBooksConnection.findFirst({
      where: { userId },
    });

    if (!connection) {
      throw new Error('QuickBooks connection not found');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${connection.realmId}/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error getting profit and loss report', error);
      throw error;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    const connection = await this.prisma.quickBooksConnection.findFirst({
      where: { userId },
    });

    if (!connection) {
      throw new Error('QuickBooks connection not found');
    }

    // In a real app, you'd check if the token is expired and refresh if needed
    // For simplicity, we'll always refresh the token
    return this.refreshToken(userId);
  }
}
