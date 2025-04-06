import Push from 'pushover-notifications';
import { Notifier, NotificationContent, PushoverNotifierOptions } from './types';

export class PushoverNotifier implements Notifier {
  private push: Push;

  constructor(options: PushoverNotifierOptions) {
    if (!options.user || !options.token) {
      throw new Error('Pushover user and token are required');
    }

    this.push = new Push({
      user: options.user,
      token: options.token,
    });
  }

  async send(content: NotificationContent): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg = {
        title: content.title,
        message: content.message,
        url: content.url,
        url_title: content.url ? 'Open Page' : undefined,
        priority: 0,
      };

      this.push.send(msg, (error: Error | null, result: unknown) => {
        if (error) {
          reject(new Error(`Failed to send Pushover notification: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}