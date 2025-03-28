/**
 * Interfaces for Slack messages, events, and command payloads
 */

// Basic Slack message interface
export interface SlackMessage {
  type: string;
  user: string;
  text: string;
  ts: string;
  channel: string;
  event_ts: string;
  team: string;
}

// Slack command payload interface
export interface SlackCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
  api_app_id: string;
}

// Slack app mention event interface
export interface SlackAppMention {
  type: string;
  user: string;
  text: string;
  ts: string;
  channel: string;
  event_ts: string;
}

// Slack event wrapper interface
export interface SlackEvent {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackMessage | SlackAppMention;
  type: string;
  event_id: string;
  event_time: number;
  authed_users?: string[];
  authorizations?: any[];
  is_ext_shared_channel: boolean;
  event_context: string;
}

// Slack interactive payload interface
export interface SlackInteractivePayload {
  type: string;
  actions: Array<{
    action_id: string;
    block_id: string;
    text: {
      type: string;
      text: string;
      emoji: boolean;
    };
    value: string;
    type: string;
  }>;
  team: {
    id: string;
    domain: string;
  };
  user: {
    id: string;
    username: string;
    team_id: string;
  };
  channel: {
    id: string;
    name: string;
  };
  response_url: string;
  trigger_id: string;
}

// Slack message block
export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: any[];
  accessory?: any;
  block_id?: string;
}

// Slack message with blocks
export interface SlackMessageWithBlocks {
  text: string;
  blocks: SlackBlock[];
  thread_ts?: string;
  mrkdwn?: boolean;
  response_type?: 'ephemeral' | 'in_channel';
  replace_original?: boolean;
  delete_original?: boolean;
} 