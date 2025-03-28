import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SlackCommandDto {
  @ApiProperty({
    description: 'Slack team ID',
    example: 'T0001',
  })
  @IsString()
  @IsNotEmpty()
  team_id: string;

  @ApiProperty({
    description: 'Slack channel ID',
    example: 'C1234',
  })
  @IsString()
  @IsNotEmpty()
  channel_id: string;

  @ApiProperty({
    description: 'Slack user ID',
    example: 'U5678',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Command text',
    example: 'analyze pnl 2023',
  })
  @IsString()
  @IsOptional()
  text: string;

  @ApiProperty({
    description: 'Command name',
    example: '/finance',
  })
  @IsString()
  @IsNotEmpty()
  command: string;
}

// Define a class for the Event object structure to use in Swagger
class SlackEventDetails {
  @ApiProperty({
    description: 'User ID',
    example: 'U5678'
  })
  user: string;

  @ApiProperty({
    description: 'Message text',
    example: 'analyze my finances'
  })
  text: string;

  @ApiProperty({
    description: 'Channel ID',
    example: 'C1234'
  })
  channel: string;

  @ApiProperty({
    description: 'Timestamp',
    example: '1234567890.123456'
  })
  ts: string;
}

export class SlackEventDto {
  @ApiProperty({
    description: 'Event type',
    example: 'message',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Event details',
    type: SlackEventDetails
  })
  @IsObject()
  event: Record<string, any>;

  @ApiProperty({
    description: 'Team ID',
    example: 'T0001',
  })
  @IsString()
  @IsNotEmpty()
  team_id: string;
}

export class SlackResponseDto {
  @ApiProperty({
    description: 'Response text',
    example: 'I\'m analyzing your P&L statement for 2023...',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Whether the response is visible to everyone in the channel',
    example: false,
    required: false,
  })
  @IsOptional()
  response_type?: 'ephemeral' | 'in_channel';
} 