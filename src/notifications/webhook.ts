import axios from 'axios';
import { Notifier, NotificationContent, WebhookNotifierOptions } from './types';

export class WebhookNotifier implements Notifier {
  private options: WebhookNotifierOptions;

  constructor(options: WebhookNotifierOptions) {
    if (!options.url) {
      throw new Error('Webhook URL is required');
    }
    this.options = options;
  }

  async send(content: NotificationContent): Promise<void> {
    try {
      const payload = {
        title: content.title,
        message: content.message,
        url: content.url,
        timestamp: new Date().toISOString(),
      };

      await axios({
        method: this.options.method,
        url: this.options.url,
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        data: payload,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to send webhook notification: ${error.message}`);
      } else {
        throw new Error('Failed to send webhook notification: Unknown error');
      }
    }
  }
}