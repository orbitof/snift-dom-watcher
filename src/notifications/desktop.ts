import notifier from 'node-notifier';
import { Notifier, NotificationContent, DesktopNotifierOptions } from './types';

export class DesktopNotifier implements Notifier {
  constructor(_options: DesktopNotifierOptions) {
    // No configuration needed for desktop notifications
  }

  async send(content: NotificationContent): Promise<void> {
    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title: content.title,
          message: content.message,
          wait: true, // Wait for user interaction
        },
        (error) => {
          if (error) {
            reject(new Error(`Failed to send desktop notification: ${error.message}`));
          } else {
            if (content.url) {
              // Open URL in default browser if provided
              // Note: This is platform-specific and may not work on all systems
              notifier.on('click', () => {
                const { exec } = require('child_process');
                const cmd = process.platform === 'win32' ? 'start' : 'open';
                exec(`${cmd} ${content.url}`);
              });
            }
            resolve();
          }
        }
      );
    });
  }
}