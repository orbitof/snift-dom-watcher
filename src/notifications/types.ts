import { DOMChangeEvent } from '../core/watcher';

export interface NotificationContent {
  title: string;
  message: string;
  url?: string;
}

export interface NotifierOptions {
  type: 'desktop' | 'pushover' | 'webhook';
}

export interface DesktopNotifierOptions extends NotifierOptions {
  type: 'desktop';
}

export interface PushoverNotifierOptions extends NotifierOptions {
  type: 'pushover';
  user: string;
  token: string;
}

export interface WebhookNotifierOptions extends NotifierOptions {
  type: 'webhook';
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
}

export interface Notifier {
  send(content: NotificationContent): Promise<void>;
}

export function createNotificationContent(event: DOMChangeEvent): NotificationContent {
  const title = 'DOM Change Detected';
  const message = event.newText
    ? `Changed to: ${event.newText}`
    : 'Content was changed';

  return {
    title,
    message,
    url: event.url,
  };
}