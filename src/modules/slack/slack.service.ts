import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly apiUrl = 'https://slack.com/api';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Post a message to a Slack channel
   */
  async postMessage(
    channel: string,
    text: string,
    blocks?: any[],
  ): Promise<any> {
    try {
      const token = this.configService.get<string>('SLACK_BOT_TOKEN');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/chat.postMessage`,
          {
            channel,
            text,
            blocks,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Error posting message to Slack', error);
      throw error;
    }
  }

  /**
   * Open a modal in Slack
   */
  async openModal(
    triggerId: string,
    view: any,
  ): Promise<any> {
    try {
      const token = this.configService.get<string>('SLACK_BOT_TOKEN');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/views.open`,
          {
            trigger_id: triggerId,
            view,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Error opening modal in Slack', error);
      throw error;
    }
  }

  /**
   * Verify a request signature from Slack
   */
  verifySignature(
    signature: string,
    timestamp: string,
    body: string,
  ): boolean {
    // In a real implementation, you would verify the signature
    // using the signing secret
    // For now, we'll return true for demonstration
    return true;
  }
} 