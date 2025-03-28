import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpStatus, Logger, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QbAccountService } from '../services/account.service';
import { CreateAccountDto, AccountResponseDto } from '../dto/account.dto';
import { ErrorResponseDto } from '../dto/quickbooks.dto';

@ApiTags('quickbooks-accounts')
@Controller('quickbooks/accounts')
export class QbAccountController {
  private readonly logger = new Logger(QbAccountController.name);

  constructor(private readonly accountService: QbAccountService) {}

  @ApiOperation({ summary: 'Create a new QuickBooks account' })
  @ApiResponse({
    status: 201,
    description: 'The account has been successfully created',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @Post()
  async createAccount(@Body() createAccountDto: CreateAccountDto) {
    try {
      // For demo purposes, we'll use our test user
      // In a real app, get the userId from authentication
      const userId = await this.getTestUserId();
      
      const result = await this.accountService.createAccount(userId, createAccountDto);
      return result;
    } catch (error) {
      this.logger.error('Failed to create QuickBooks account', error);
      throw new HttpException(
        { error: error.message || 'Failed to create QuickBooks account' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get a QuickBooks account by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The ID of the QuickBooks account',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The account has been successfully retrieved',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @Get(':id')
  async getAccount(@Param('id') id: string) {
    try {
      // For demo purposes, we'll use our test user
      // In a real app, get the userId from authentication
      const userId = await this.getTestUserId();

      const result = await this.accountService.getAccount(userId, id);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get QuickBooks account with ID ${id}`, error);
      throw new HttpException(
        { error: error.message || 'Failed to get QuickBooks account' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Query QuickBooks accounts' })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Custom SQL-like query string (default: SELECT * FROM Account)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Account query results',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @Get()
  async queryAccounts(@Query('query') query?: string) {
    try {
      // For demo purposes, we'll use our test user
      // In a real app, get the userId from authentication
      const userId = await this.getTestUserId();

      const result = await this.accountService.queryAccounts(userId, query);
      return result;
    } catch (error) {
      this.logger.error('Failed to query QuickBooks accounts', error);
      throw new HttpException(
        { error: error.message || 'Failed to query QuickBooks accounts' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper method to get the test user ID for demonstration
  private async getTestUserId(): Promise<string> {
    // In a real app, this would come from the session or JWT token
    // For now, we'll just return a placeholder ID
    return '7884d454-32ac-4d4a-9ce2-1ca2f0ab2f80'; // Replace with your test user ID
  }
} 