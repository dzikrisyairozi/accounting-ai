import { Controller, Get, Query, Redirect, Logger, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SlackOAuthService } from '../services/oauth.service';

@ApiTags('slack')
@Controller('slack')
export class SlackOAuthController {
  private readonly logger = new Logger(SlackOAuthController.name);

  constructor(
    private readonly slackOAuthService: SlackOAuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Initiate Slack app installation' })
  @Get('install')
  @Redirect()
  async initiateInstall() {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    const scopes = [
      'app_mentions:read',
      'channels:history',
      'channels:read',
      'chat:write',
      'commands',
      'im:history',
      'im:read',
      'users:read',
    ].join(',');
    
    const redirectUri = this.configService.get<string>('SLACK_REDIRECT_URI');
    
    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
    
    return { url };
  }

  @ApiOperation({ summary: 'Handle OAuth redirect from Slack' })
  @ApiQuery({ name: 'code', required: true, description: 'Temporary authorization code from Slack' })
  @ApiQuery({ name: 'state', required: false, description: 'State parameter if provided in the original request' })
  @Get('oauth')
  async handleOAuthRedirect(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    try {
      if (error) {
        this.logger.error(`OAuth error: ${error}`);
        return res.redirect('/slack/install-error?error=' + encodeURIComponent(error));
      }

      if (!code) {
        this.logger.error('No code provided in OAuth callback');
        return res.redirect('/slack/install-error?error=no_code');
      }

      // Exchange the code for tokens
      const result = await this.slackOAuthService.exchangeCodeForTokens(code);
      
      // Success redirect
      return res.redirect('/slack/install-success');
    } catch (err) {
      this.logger.error('OAuth flow error:', err);
      return res.redirect(`/slack/install-error?error=${encodeURIComponent(err.message)}`);
    }
  }

  @ApiOperation({ summary: 'Installation success page' })
  @Get('install-success')
  installationSuccess(@Res() res: Response) {
    res.send(`
      <html>
        <head>
          <title>Installation Successful</title>
          <style>
            body {
              font-family: 'Lato', sans-serif;
              background-color: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              padding: 40px;
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #4A154B;
              margin-bottom: 20px;
            }
            p {
              color: #333;
              line-height: 1.6;
            }
            .success-icon {
              font-size: 48px;
              color: #36C5F0;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Installation Successful</h1>
            <p>The Accounting AI bot has been successfully installed to your Slack workspace.</p>
            <p>You can now use the bot in your Slack channels.</p>
          </div>
        </body>
      </html>
    `);
  }

  @ApiOperation({ summary: 'Installation error page' })
  @Get('install-error')
  installationError(@Query('error') error: string, @Res() res: Response) {
    res.send(`
      <html>
        <head>
          <title>Installation Failed</title>
          <style>
            body {
              font-family: 'Lato', sans-serif;
              background-color: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              padding: 40px;
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #E01E5A;
              margin-bottom: 20px;
            }
            p {
              color: #333;
              line-height: 1.6;
            }
            .error-details {
              background-color: #f8f8f8;
              border-radius: 4px;
              padding: 10px;
              font-family: monospace;
              margin-top: 20px;
              text-align: left;
            }
            .error-icon {
              font-size: 48px;
              color: #E01E5A;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✗</div>
            <h1>Installation Failed</h1>
            <p>There was an error installing the Accounting AI bot to your Slack workspace.</p>
            ${error ? `<div class="error-details">Error: ${error}</div>` : ''}
            <p>Please try again or contact support for assistance.</p>
          </div>
        </body>
      </html>
    `);
  }
} 