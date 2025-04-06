#!/usr/bin/env node

import { program } from 'commander';
import { ConfigManager } from '../config';
import { DOMWatcher } from '../core/watcher';
import { NotificationManager } from '../notifications';
import { formatLog } from '../utils/date';

program
  .name('snift')
  .description('DOM element change monitor with notifications')
  .version('1.0.0');

program
  .command('watch')
  .description('Start watching DOM element changes')
  .option('-c, --config <path>', 'Path to config file', 'config/snift.config.json')
  .action(async (options) => {
    try {
      console.log(formatLog('Initializing notification system...'));
      const configManager = new ConfigManager(options.config);
      const config = configManager.getConfig();
      const notificationManager = new NotificationManager(config);

      console.log(formatLog('Initializing DOM watcher...'));
      const watcher = new DOMWatcher(config);

      // Handle DOM changes
      watcher.on('change', async (event) => {
        console.log(formatLog('Change detected, sending notifications...'));
        try {
          await notificationManager.notify(event);
          console.log(formatLog('Notifications sent successfully'));
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error(formatLog('Notification error:'), error.message);
          } else {
            console.error(formatLog('Unknown notification error occurred'));
          }
        }
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        console.log(formatLog('\nStopping watcher...'));
        await watcher.stop();
        process.exit(0);
      });

      console.log(formatLog('Starting DOM watcher...'));
      console.log(formatLog('Press Ctrl+C to stop watching'));
      console.log(formatLog('-----------------------------'));
      await watcher.start();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(formatLog('Error:'), error.message);
      } else {
        console.error(formatLog('Unknown error occurred'));
      }
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test notifications')
  .option('-c, --config <path>', 'Path to config file', 'config/snift.config.json')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager(options.config);
      const config = configManager.getConfig();
      const notificationManager = new NotificationManager(config);
      
      console.log(formatLog('Testing notifications...'));
      await notificationManager.test();
      console.log(formatLog('Test notifications sent successfully'));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(formatLog('Error:'), error.message);
      } else {
        console.error(formatLog('Unknown error occurred'));
      }
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Config file operations')
  .option('--init', 'Create default config file')
  .option('-o, --output <path>', 'Output path for config file', 'config/snift.config.json')
  .action(async (options) => {
    try {
      if (options.init) {
        const outputPath = options.output;
        ConfigManager.createDefaultConfig(outputPath);
        console.log(formatLog(`Default config created at: ${outputPath}`));
        console.log(formatLog('Please update the config with your settings before running the watcher.'));
      } else {
        program.help();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(formatLog('Error:'), error.message);
      } else {
        console.error(formatLog('Unknown error occurred'));
      }
      process.exit(1);
    }
  });

program.parse();