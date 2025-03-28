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

  @ApiOperation({ summary: 'Initiate QuickBooks OAuth flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to QuickBooks authorization page',
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

  @ApiOperation({ summary: 'Handle QuickBooks OAuth callback' })
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
      // In a real app, verify the state parameter from session
      // For demo purposes, we'll skip this step

      // Get the tokens from QuickBooks
      const tokens = await this.quickbooksService.getTokens(queryParams.code);

      // In a real app, get the userId from session
      // For demonstration, we'll use our test user
      const user = await this.prisma.user.findFirst({
        where: { email: 'test@example.com' },
      });

      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'User not found' });
      }

      // Check if a connection already exists
      const existingConnection = await this.prisma.quickBooksConnection.findFirst({
        where: { userId: user.id },
      });

      // Update or create the connection
      if (existingConnection) {
        await this.prisma.quickBooksConnection.update({
          where: { id: existingConnection.id },
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            realmId: queryParams.realmId,
          },
        });
      } else {
        await this.prisma.quickBooksConnection.create({
          data: {
            userId: user.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            realmId: queryParams.realmId,
          },
        });
      }

      return res.status(HttpStatus.OK).json({
        message: 'Successfully connected to QuickBooks',
        userId: user.id,
      });
    } catch (error) {
      this.logger.error('Error in QuickBooks callback', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to connect to QuickBooks',
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
