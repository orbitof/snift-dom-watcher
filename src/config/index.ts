import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Config } from './types';
import { validateInterval } from './utils';

export class ConfigManager {
  private config: Config;

  constructor(configPath?: string) {
    // Load default config
    const defaultConfig = JSON.parse(
      readFileSync(resolve(__dirname, '../../default.config.json'), 'utf-8')
    );

    if (configPath) {
      try {
        // Load user config and merge with default
        const userConfig = JSON.parse(readFileSync(resolve(configPath), 'utf-8'));
        this.config = { ...defaultConfig, ...userConfig };
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
        } else {
          throw new Error(`Failed to load config from ${configPath}: Unknown error`);
        }
      }
    } else {
      this.config = defaultConfig;
    }

    this.validateConfig();
  }

  private validateConfig(): void {
    const { url, selector, notify, interval } = this.config;

    if (!url || typeof url !== 'string') {
      throw new Error('Config: url is required and must be a string');
    }

    if (!selector || typeof selector !== 'string') {
      throw new Error('Config: selector is required and must be a string');
    }

    if (!Array.isArray(notify) || notify.length === 0) {
      throw new Error('Config: notify must be a non-empty array');
    }

    if (!interval || typeof interval !== 'string') {
      throw new Error('Config: interval is required and must be a string');
    }

    // Validate interval format
    validateInterval(interval);

    // Validate notification specific configs
    if (notify.includes('pushover') && !this.config.pushover) {
      throw new Error('Config: pushover configuration is required when pushover notification is enabled');
    }

    if (notify.includes('webhook') && !this.config.webhook) {
      throw new Error('Config: webhook configuration is required when webhook notification is enabled');
    }
  }

  public getConfig(): Config {
    return { ...this.config };
  }

  public static createDefaultConfig(outputPath: string): void {
    try {
      const defaultConfig = readFileSync(
        resolve(__dirname, '../../default.config.json'),
        'utf-8'
      );
      const configPath = resolve(outputPath);
      writeFileSync(configPath, defaultConfig, 'utf-8');
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to create default config at ${outputPath}: ${error.message}`);
      } else {
        throw new Error(`Failed to create default config at ${outputPath}: Unknown error`);
      }
    }
  }
}