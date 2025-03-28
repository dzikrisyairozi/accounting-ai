import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../database/prisma.service';
import { BoltService } from './bolt.service';

interface SlackOAuthResponse {
  ok: boolean;
  app_id: string;
  authed_user: {
    id: string;
    scope: string;
    access_token?: string;
    token_type?: string;
  };
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
  is_enterprise_install?: boolean;
  bot_user_id: string;
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  expires_in?: number;
}

@Injectable()
export class SlackOAuthService {
  private readonly logger = new Logger(SlackOAuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly boltService: BoltService,
  ) {}

  /**
   * Exchange the temporary authorization code for permanent tokens
   */
  async exchangeCodeForTokens(code: string): Promise<SlackOAuthResponse> {
    try {
      const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
      const clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('SLACK_REDIRECT_URI');

      this.logger.log(`Exchanging code for tokens with redirect URI: ${redirectUri}`);

      // Make a request to the Slack API to exchange the code for tokens
      const response = await firstValueFrom(
        this.httpService.post<SlackOAuthResponse>('https://slack.com/api/oauth.v2.access', null, {
          params: {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data}`);
      }

      const tokenData = response.data;
      
      // Store the installation in the database
      await this.storeInstallation(tokenData);

      // Update the BoltService with the new token
      this.boltService.updateToken(tokenData.access_token);

      return tokenData;
    } catch (error) {
      this.logger.error('Error exchanging code for tokens', error);
      throw error;
    }
  }

  /**
   * Store the Slack installation data in the database
   */
  private async storeInstallation(tokenData: SlackOAuthResponse): Promise<void> {
    try {
      const { team, bot_user_id, access_token, refresh_token, authed_user } = tokenData;

      // Find or create user with the Slack ID
      let user = await this.prisma.user.findFirst({
        where: { slackId: authed_user.id },
      });

      if (!user) {
        // Get user info from Slack
        const userInfo = await this.getUserInfo(authed_user.id, access_token);
        
        // Create user in the database
        user = await this.prisma.user.create({
          data: {
            name: userInfo.real_name || userInfo.name || `Slack User ${authed_user.id}`,
            email: userInfo.email || `slack-${authed_user.id}@example.com`,
            slackId: authed_user.id,
          },
        });

        this.logger.log(`Created new user for Slack ID: ${authed_user.id}`);
      }

      // Store the workspace information if needed
      const workspace = await this.storeWorkspace(team);

      // Store the bot installation
      await this.prisma.slackBotInstallation.upsert({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: user.id,
          },
        },
        create: {
          teamId: team.id,
          userId: user.id,
          botUserId: bot_user_id,
          botToken: access_token,
          refreshToken: refresh_token || null,
          scope: tokenData.scope,
        },
        update: {
          botUserId: bot_user_id,
          botToken: access_token,
          refreshToken: refresh_token || null,
          scope: tokenData.scope,
        },
      });

      this.logger.log(`Stored Slack bot installation for team ${team.id} and user ${user.id}`);
    } catch (error) {
      this.logger.error('Error storing installation', error);
      throw error;
    }
  }

  /**
   * Store or update the Slack workspace
   */
  private async storeWorkspace(team: { id: string; name: string }) {
    return this.prisma.slackWorkspace.upsert({
      where: { id: team.id },
      create: {
        id: team.id,
        name: team.name,
      },
      update: {
        name: team.name,
      },
    });
  }

  /**
   * Get user information from Slack
   */
  private async getUserInfo(userId: string, token: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://slack.com/api/users.info', {
          params: { user: userId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data.user;
    } catch (error) {
      this.logger.error(`Error getting user info for ${userId}`, error);
      throw error;
    }
  }
} 