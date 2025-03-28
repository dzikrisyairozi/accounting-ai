import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QuickbooksTokensDto {
  @ApiProperty({
    description: 'QuickBooks access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    description: 'QuickBooks refresh token',
    example: 'AB11578207653...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({
    description: 'QuickBooks realm ID (company ID)',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  realmId: string;
}

export class ProfitAndLossQueryDto {
  @ApiProperty({
    description: 'Start date for the P&L report (YYYY-MM-DD)',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the P&L report (YYYY-MM-DD)',
    example: '2023-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class QuickbooksCallbackQueryDto {
  @ApiProperty({
    description: 'Authorization code from QuickBooks OAuth flow',
    example: 'AB11CD22EF33...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Realm ID (company ID) from QuickBooks',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  realmId: string;

  @ApiProperty({
    description: 'State parameter to prevent CSRF attacks',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  state: string;
}

export class ConnectionResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Successfully connected to QuickBooks',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  userId: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Failed to connect to QuickBooks',
  })
  @IsString()
  error: string;
} 