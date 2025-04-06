# snift-dom-watcher

A CLI tool that monitors specified DOM elements on web pages and sends notifications when changes are detected.

## Features

- 🔍 Monitors any DOM element using CSS selectors
- 🔄 Supports dynamic content and SPAs
- 📱 Multiple notification methods (Desktop, Pushover, Webhook)
- 🚀 Easy to configure and use
- 🛠 Robust error handling and retry mechanism

## Installation

```bash
npm install -g snift-dom-watcher
```

## Quick Start

1. Create your personal config:

```bash
# Copy default config
cp snift.config.json local/my.config.json

# Edit your configuration
vim local/my.config.json
```

2. Start monitoring:

```bash
snift watch -c local/my.config.json
```

Note: If no config file is specified, snift will use `snift.config.json` from the current directory.

## Configuration

### Basic Settings

- `url`: Target webpage URL
- `selector`: CSS selector for the element to monitor
- `interval`: Check interval (e.g., "30s", "1m", "1h")
- `notify`: Array of notification methods to use ("desktop", "pushover", "webhook")

### Project Structure

- `snift.config.json`: Default configuration file
- `examples/`: Example configurations for different use cases
- `local/`: Directory for personal configurations (\*.json files are gitignored)

Best practices:

1. Start with `snift.config.json` as a template
2. Store personal configs in `local/` directory
3. Use meaningful names (e.g., `local/my.config.json`)
4. Check `examples/` for specific use cases

### Supported Intervals

- Seconds: "30s", "45s"
- Minutes: "1m", "5m", "30m"
- Hours: "1h", "2h"

### Notification Methods

1. Desktop Notifications

```json
{
  "notify": ["desktop"]
}
```

2. Pushover Notifications

```json
{
  "notify": ["pushover"],
  "pushover": {
    "user": "YOUR_USER_KEY",
    "token": "YOUR_APP_TOKEN"
  }
}
```

3. Webhook

```json
{
  "notify": ["webhook"],
  "webhook": {
    "url": "https://your-webhook-url.com",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

## Advanced Features

### Error Handling

- `retryOnError`: Automatically retry on errors when set to `true`

### Testing Notifications

Test your notification settings:

```bash
snift test
```

## Example Use Case

You can find example configurations in the `examples/` directory. For instance, monitor Apple Store refurbished products:

```json
{
  "url": "https://www.apple.com/shop/product/G1CF2LL/A/",
  "selector": "li.rf-dude-quote-delivery-message",
  "notify": ["desktop", "pushover"],
  "interval": "1m",
  "retryOnError": true
}
```

This example monitors the availability status of a specific refurbished product on the Apple Store. You'll receive notifications when the status changes (e.g., from "Out of stock" to "Available").

## Command Line Interface

```bash
# Start watching with default config (snift.config.json)
snift watch

# Start watching with custom config
snift watch -c local/my.config.json

# Test notifications
snift test

# Show help
snift --help
```

## Troubleshooting

1. Element not found

- Verify the selector using browser dev tools
- Check if the content is dynamically loaded
- Try increasing the check interval

2. No notifications

- Check notification settings in config
- Run `snift test` to verify notification setup
- Check system notification settings

3. High CPU/Memory usage

- Increase the check interval
- Avoid monitoring rapidly changing elements
- Consider using webhook notifications for better performance

## License

MIT
