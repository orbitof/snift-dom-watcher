export interface PushoverConfig {
  user: string;
  token: string;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
}

/**
 * Interval string format: e.g. "30s", "1m", "1h"
 * Supported units:
 * - s: seconds
 * - m: minutes
 * - h: hours
 */
export interface Config {
  url: string;
  selector: string;
  notify: ('pushover' | 'webhook' | 'desktop')[];
  interval: string; // e.g. "1m", "30s", "1h"
  pushover?: PushoverConfig;
  webhook?: WebhookConfig;
  retryOnError?: boolean;
}