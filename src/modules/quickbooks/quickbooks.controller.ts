import { Controller, Get, Query, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { QuickbooksService } from './quickbooks.service';
import { PrismaService } from '../../database/prisma.service';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  ProfitAndLossQueryDto,
  QuickbooksCallbackQueryDto,
  ConnectionResponseDto,
  ErrorResponseDto,
} from './dto/quickbooks.dto';

@ApiTags('quickbooks')
@Controller('quickbooks')
export class QuickbooksController {
  private readonly logger = new Logger(QuickbooksController.name);

  constructor(
    private readonly quickbooksService: QuickbooksService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ 
    summary: 'Initiate QuickBooks OAuth flow',
    description: 'Redirects the browser to QuickBooks authorization page. This endpoint should be opened in a browser tab, not executed from Swagger UI.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to QuickBooks authorization page. Cannot be tested directly in Swagger UI - open in a new browser tab instead.',
  })
  @Get('authorize')
  async authorize(@Req() req: Request, @Res() res: Response) {
    // In a real application, you'd get the userId from the session
    // For demonstration, we'll create a test user if one doesn't exist
    let user = await this.prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    }

    // Generate a state parameter to prevent CSRF
    const state = uuid();

    // Store the state and userId in session (in a real app)
    // For demo purposes, we'll just use the state as is

    const authUrl = this.quickbooksService.getAuthorizationUrl(state);
    return res.redirect(authUrl);
  }

  @ApiOperation({ 
    summary: 'Handle QuickBooks OAuth callback',
    description: 'Processes the response from QuickBooks after authorization'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully connected to QuickBooks',
    type: ConnectionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @Get('callback')
  async callback(
    @Query() queryParams: QuickbooksCallbackQueryDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Callback received with code, state, and realmId`);
      this.logger.log(`RealmId: ${queryParams.realmId}`);
      
      // Get the tokens from QuickBooks
      let tokens;
      try {
        tokens = await this.quickbooksService.getTokens(queryParams.code);
        this.logger.log('Tokens received successfully');
      } catch (tokenError) {
        this.logger.error('Failed to exchange code for tokens', tokenError);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
          error: 'Failed to obtain QuickBooks access tokens' 
        });
      }
      
      // In a real app, get the userId from session
      // For demonstration, we'll use our test user
      const user = await this.prisma.user.findFirst({
        where: { email: 'test@example.com' },
      });
      
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'User not found' });
      }
      
      this.logger.log(`User found: ${user.id}`);
      
      // Check if a connection already exists
      const existingConnection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId: user.id },
      });
      
      // Make sure we have both required tokens
      if (!tokens.accessToken || !tokens.refreshToken) {
        this.logger.error('Missing required tokens', tokens);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
          error: 'Invalid token response from QuickBooks' 
        });
      }
      
      // Update or create the connection
      try {
        if (existingConnection) {
          this.logger.log(`Updating existing connection for user ${user.id}`);
          await this.prisma.quickBooksConnection.update({
            where: { id: existingConnection.id },
            data: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              realmId: queryParams.realmId,
            },
          });
        } else {
          this.logger.log(`Creating new connection for user ${user.id}`);
          await this.prisma.quickBooksConnection.create({
            data: {
              userId: user.id,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              realmId: queryParams.realmId,
            },
          });
        }
        
        this.logger.log('Connection saved successfully');
        return res.status(HttpStatus.OK).json({ 
          message: 'Successfully connected to QuickBooks',
          userId: user.id,
        });
      } catch (dbError) {
        this.logger.error('Database error saving connection', dbError);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
          error: 'Failed to save QuickBooks connection' 
        });
      }
    } catch (error) {
      this.logger.error('Error in QuickBooks callback', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: 'Failed to connect to QuickBooks' 
      });
    }
  }

  @ApiOperation({ summary: 'Get profit and loss report' })
  @ApiResponse({
    status: 200,
    description: 'Profit and loss report data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @Get('pnl')
  async getProfitAndLoss(
    @Query() query: ProfitAndLossQueryDto,
    @Res() res: Response,
  ) {
    try {
      // In a real app, get the userId from session
      // For demonstration, we'll use our test user
      const user = await this.prisma.user.findFirst({
        where: { email: 'test@example.com' },
      });

      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'User not found' });
      }

      const data = await this.quickbooksService.getProfitAndLoss(
        user.id,
        query.startDate || '2023-01-01',
        query.endDate || '2023-12-31',
      );

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      this.logger.error('Error getting profit and loss', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get profit and loss data',
      });
    }
  }
}
