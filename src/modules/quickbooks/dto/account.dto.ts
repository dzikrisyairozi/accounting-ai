import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength, IsNotEmpty, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// Enum for Account Types
export enum AccountTypeEnum {
  BANK = 'Bank',
  ACCOUNTS_RECEIVABLE = 'Accounts Receivable',
  OTHER_CURRENT_ASSET = 'Other Current Asset',
  FIXED_ASSET = 'Fixed Asset',
  OTHER_ASSET = 'Other Asset',
  ACCOUNTS_PAYABLE = 'Accounts Payable',
  CREDIT_CARD = 'Credit Card',
  OTHER_CURRENT_LIABILITY = 'Other Current Liability',
  LONG_TERM_LIABILITY = 'Long Term Liability',
  EQUITY = 'Equity',
  INCOME = 'Income',
  EXPENSE = 'Expense',
  OTHER_INCOME = 'Other Income',
  OTHER_EXPENSE = 'Other Expense',
  COST_OF_GOODS_SOLD = 'Cost of Goods Sold',
}

// Reference Type
export class ReferenceDto {
  @ApiProperty({
    description: 'Value of the referenced entity',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({
    description: 'Name of the referenced entity',
    example: 'United States Dollar',
  })
  @IsString()
  @IsOptional()
  name?: string;
}

// Create Account Request DTO
export class CreateAccountDto {
  @ApiProperty({
    description: 'Name of the account (must be unique)',
    example: 'MyJobs_test',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  Name: string;

  @ApiProperty({
    description: 'Type of account',
    enum: AccountTypeEnum,
    example: AccountTypeEnum.ACCOUNTS_RECEIVABLE,
  })
  @IsEnum(AccountTypeEnum)
  @IsNotEmpty()
  AccountType: AccountTypeEnum;

  @ApiPropertyOptional({
    description: 'User-defined account number',
    example: 'A-1001',
  })
  @IsString()
  @IsOptional()
  AcctNum?: string;

  @ApiPropertyOptional({
    description: 'Subtype of the account',
    example: 'AccountsReceivable',
  })
  @IsString()
  @IsOptional()
  AccountSubType?: string;

  @ApiPropertyOptional({
    description: 'Description of the account',
    example: 'Account for tracking receivables from jobs',
  })
  @IsString()
  @IsOptional()
  Description?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a sub-account',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  SubAccount?: boolean;

  @ApiPropertyOptional({
    description: 'Parent account reference if this is a sub-account',
    type: () => ReferenceDto,
  })
  @ValidateNested()
  @Type(() => ReferenceDto)
  @IsOptional()
  ParentRef?: ReferenceDto;

  @ApiPropertyOptional({
    description: 'Currency reference',
    type: () => ReferenceDto,
  })
  @ValidateNested()
  @Type(() => ReferenceDto)
  @IsOptional()
  CurrencyRef?: ReferenceDto;
}

// Metadata Type
export class MetadataDto {
  @ApiProperty({
    description: 'Creation time',
    example: '2014-12-31T09:29:05-08:00',
  })
  CreateTime: string;

  @ApiProperty({
    description: 'Last updated time',
    example: '2014-12-31T09:29:05-08:00',
  })
  LastUpdatedTime: string;
}

// Currency Reference Type
export class CurrencyRefDto {
  @ApiProperty({
    description: 'Currency name',
    example: 'United States Dollar',
  })
  name: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  value: string;
}

// Account Object Type
export class AccountDto {
  @ApiProperty({
    description: 'ID of the account',
    example: '94',
  })
  Id: string;

  @ApiProperty({
    description: 'Name of the account',
    example: 'MyJobs',
  })
  Name: string;

  @ApiProperty({
    description: 'Full name of the account',
    example: 'MyJobs',
  })
  FullyQualifiedName: string;

  @ApiProperty({
    description: 'Type of account',
    example: 'Accounts Receivable',
  })
  AccountType: string;

  @ApiProperty({
    description: 'Classification of the account',
    example: 'Asset',
  })
  Classification: string;

  @ApiProperty({
    description: 'Subtype of the account',
    example: 'AccountsReceivable',
  })
  AccountSubType: string;

  @ApiProperty({
    description: 'Currency reference',
    type: () => CurrencyRefDto,
  })
  CurrencyRef: CurrencyRefDto;
  
  @ApiProperty({
    description: 'Current balance',
    example: 0,
  })
  CurrentBalance: number;

  @ApiProperty({
    description: 'Whether the account is active',
    example: true,
  })
  Active: boolean;

  @ApiProperty({
    description: 'Sync token for optimistic locking',
    example: '0',
  })
  SyncToken: string;

  @ApiProperty({
    description: 'Whether this is a sub-account',
    example: false,
  })
  SubAccount: boolean;

  @ApiProperty({
    description: 'Metadata about the account',
    type: () => MetadataDto,
  })
  MetaData: MetadataDto;
}

// Account Response DTO
export class AccountResponseDto {
  @ApiProperty({
    description: 'The Account object',
    type: () => AccountDto,
  })
  Account: AccountDto;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2014-12-31T09:29:05.717-08:00',
  })
  time: string;
} 