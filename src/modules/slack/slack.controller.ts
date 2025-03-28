import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SlackCommandDto, SlackEventDto, SlackResponseDto } from './dto/slack.dto';

@ApiTags('slack')
@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name);

  @ApiOperation({ summary: 'Handle Slack slash commands' })
  @ApiBody({ type: SlackCommandDto })
  @ApiResponse({
    status: 200,
    description: 'Command processed successfully',
    type: SlackResponseDto,
  })
  @Post('command')
  @HttpCode(HttpStatus.OK)
  handleCommand(@Body() command: SlackCommandDto): SlackResponseDto {
    this.logger.log(`Received command: ${command.command} ${command.text}`);
    
    // This is a placeholder - in a real app, you'd process the command
    // and potentially call the QuickBooks service for financial data
    return {
      text: `I received your command: "${command.command} ${command.text}". I'm working on it!`,
      response_type: 'ephemeral',
    };
  }

  @ApiOperation({ summary: 'Handle Slack events' })
  @ApiBody({ type: SlackEventDto })
  @ApiResponse({
    status: 200,
    description: 'Event acknowledged',
  })
  @Post('events')
  @HttpCode(HttpStatus.OK)
  handleEvent(@Body() eventPayload: SlackEventDto): { challenge?: string } {
    this.logger.log(`Received event: ${eventPayload.type}`);
    
    // Handle URL verification challenge from Slack
    if (eventPayload.type === 'url_verification') {
      return { challenge: eventPayload['challenge'] };
    }
    
    // Process the event (in a real app)
    // For now, we'll just acknowledge it
    return {};
  }
} 