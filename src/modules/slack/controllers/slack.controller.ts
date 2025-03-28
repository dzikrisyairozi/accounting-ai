import { Controller, Post, All, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { BoltService } from '../services/bolt.service';

@ApiTags('slack')
@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name);

  constructor(private readonly boltService: BoltService) {}

  // This endpoint will be used by Slack for all webhook events
  // The Bolt framework will handle the different types of events
  @ApiOperation({ summary: 'Handle all Slack webhook events' })
  @All('events')
  async handleEvents(@Req() req: Request): Promise<any> {
    // The actual handling is done by the Bolt framework
    // This endpoint just exposes the Bolt receiver to the outside world
    this.logger.debug('Received Slack event');
    return { success: true };
  }
} 