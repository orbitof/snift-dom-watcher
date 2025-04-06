import { Config } from '../config/types';
import { DOMChangeEvent } from '../core/watcher';
import { Notifier, createNotificationContent } from './types';
import { DesktopNotifier } from './desktop';
import { PushoverNotifier } from './pushover';
import { WebhookNotifier } from './webhook';

export class NotificationManager {
  private notifiers: Notifier[] = [];

  constructor(config: Config) {
    // Initialize configured notifiers
    for (const type of config.notify) {
      switch (type) {
        case 'desktop':
          this.notifiers.push(new DesktopNotifier({ type }));
          break;

        case 'pushover':
          if (!config.pushover) {
            throw new Error('Pushover configuration is required');
          }
          this.notifiers.push(
            new PushoverNotifier({
              type,
              user: config.pushover.user,
              token: config.pushover.token,
            })
          );
          break;

        case 'webhook':
          if (!config.webhook) {
            throw new Error('Webhook configuration is required');
          }
          this.notifiers.push(
            new WebhookNotifier({
              type,
              url: config.webhook.url,
              method: config.webhook.method,
              headers: config.webhook.headers,
            })
          );
          break;
      }
    }

    if (this.notifiers.length === 0) {
      throw new Error('At least one notification method must be configured');
    }
  }

  async notify(event: DOMChangeEvent): Promise<void> {
    const content = createNotificationContent(event);
    const errors: Error[] = [];

    // Send notifications in parallel
    const promises = this.notifiers.map(async (notifier) => {
      try {
        await notifier.send(content);
      } catch (error: unknown) {
        if (error instanceof Error) {
          errors.push(error);
        } else {
          errors.push(new Error('Unknown error occurred during notification'));
        }
      }
    });

    await Promise.all(promises);

    // If all notifications failed, throw an error
    if (errors.length === this.notifiers.length) {
      throw new Error(
        `All notifications failed:\n${errors.map((e) => e.message).join('\n')}`
      );
    }
  }

  async test(): Promise<void> {
    const testEvent: DOMChangeEvent = {
      timestamp: Date.now(),
      oldText: 'Test old content',
      newText: 'Test new content',
      url: 'https://example.com',
      selector: '#test-element',
    };

    await this.notify(testEvent);
  }
}