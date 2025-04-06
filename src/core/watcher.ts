import puppeteer, { Browser, Page } from 'puppeteer';
import { EventEmitter } from 'events';
import { Config } from '../config/types';
import { parseInterval } from '../config/utils';
import { getErrorMessage } from '../utils/error';
import { formatLog } from '../utils/date';

export interface DOMChangeEvent {
  timestamp: number;
  oldText?: string;
  newText?: string;
  url: string;
  selector: string;
}

export interface DOMWatcherEvents {
  change: (changeEvent: DOMChangeEvent) => void;
}

export class DOMWatcher extends EventEmitter {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: Config;
  private lastText: string | null = null;
  private isWatching = false;
  private isInitialized = false;
  private lastPageLoad = 0;

  constructor(config: Config) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.isWatching) {
      throw new Error('Already watching');
    }

    try {
      console.log(formatLog('Launching browser...'));
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--enable-javascript',
          '--disable-web-security',
          '--aggressive-cache-discard',
          '--disable-cache',
          '--disable-application-cache',
          '--disable-offline-load-stale-cache',
          '--disable-gpu-shader-disk-cache',
          '--media-cache-size=0',
          '--disk-cache-size=0'
        ]
      });

      await this.initPage();
      
      // Get initial content
      const initialText = await this.getElementText();
      this.lastText = this.normalizeText(initialText);
      console.log(formatLog('Initial content:'), this.lastText);
      this.isInitialized = true;

      // Start watching
      this.isWatching = true;
      this.watch();
      
      console.log(formatLog(`Started watching ${this.config.selector} at ${this.config.url}`));
      console.log(formatLog(`Checking every ${this.config.interval}`));
    } catch (error: unknown) {
      await this.cleanup();
      throw new Error(`Failed to start watching: ${getErrorMessage(error)}`);
    }
  }

  private async initPage(): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    console.log(formatLog('Creating new page...'));
    this.page = await this.browser.newPage();

    // Enable JavaScript explicitly
    await this.page.setJavaScriptEnabled(true);

    // Emulate desktop browser
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Disable cache
    const client = await this.page.target().createCDPSession();
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    
    // Set viewport
    await this.page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
    });

    // Set request interception
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      // Add no-cache headers
      const headers = {
        ...request.headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };

      // Allow all resources to ensure proper JavaScript execution
      request.continue({ headers });
    });

    // Log console messages for debugging
    this.page.on('console', msg => {
      console.log(formatLog(`Browser console: ${msg.text()}`));
    });

    // Set longer timeouts for dynamic content
    await this.page.setDefaultNavigationTimeout(60000);
    await this.page.setDefaultTimeout(60000);
    
    await this.loadPage();
  }

  private normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // 複数の空白を1つに
      .replace(/\n+/g, ' ') // 改行を空白に
      .replace(/NEW\s*$/g, 'NEW'); // 末尾のNEWの後の空白を削除
  }

  private async waitForPageLoad(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    console.log(formatLog('Waiting for page load completion...'));
    
    try {
      // Wait for load event
      await this.page.waitForNavigation({
        waitUntil: 'load',
        timeout: 30000
      }).catch(() => {
        console.log(formatLog('Load timeout - continuing...'));
      });

      // Wait for network to be mostly idle
      await this.page.waitForNetworkIdle({
        timeout: 30000,
        idleTime: 2000
      }).catch(() => {
        console.log(formatLog('Network idle timeout - continuing...'));
      });

      // Wait for no loading indicators
      await this.page.waitForFunction(() => {
        return !document.querySelector('.loading') && 
               !document.querySelector('[aria-busy="true"]') &&
               document.readyState === 'complete';
      }, { timeout: 30000 }).catch(() => {
        console.log(formatLog('Loading state check timeout - continuing...'));
      });

      // Additional wait for any remaining dynamic content
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error(formatLog('Error during page load:'), error);
      throw error;
    }
  }

  private async waitForElement(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    console.log(formatLog(`Waiting for selector "${this.config.selector}"...`));
    
    try {
      // First check if element exists in DOM
      const elementHandle = await this.page.$(this.config.selector);
      if (!elementHandle) {
        console.log(formatLog('Element not found in initial DOM, waiting...'));
      }

      // Wait for element to be present and visible
      await this.page.waitForSelector(this.config.selector, {
        visible: true,
        timeout: 30000
      });

      if (elementHandle) {
        elementHandle.dispose();
      }

    } catch (error) {
      console.error(formatLog('Error waiting for element:'), error);
      throw error;
    }
  }

  private async loadPage(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    console.log(formatLog(`Loading page ${this.config.url}...`));
    try {
      // Clear cookies and cache before loading
      const client = await this.page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
      await client.send('Network.clearBrowserCache');

      // Navigate to the page
      await this.page.goto(this.config.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for full page load
      await this.waitForPageLoad();

      // Wait for target element
      await this.waitForElement();

      this.lastPageLoad = Date.now();

    } catch (error) {
      console.error(formatLog('Navigation error:'), error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isWatching = false;
    await this.cleanup();
    console.log(formatLog('Watcher stopped'));
  }

  private async cleanup(): Promise<void> {
    if (this.page) {
      try {
        await this.page.close();
      } catch (error) {
        console.error(formatLog('Error closing page:'), getErrorMessage(error));
      }
      this.page = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error(formatLog('Error closing browser:'), getErrorMessage(error));
      }
      this.browser = null;
    }
    this.isInitialized = false;
  }

  private async getElementText(): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      await this.waitForElement();

      const text = await this.page.$eval(this.config.selector, (element) => {
        return element.textContent || '';
      });

      console.log(formatLog('Raw element text:'), text);
      return text;
    } catch (error) {
      throw new Error(`Failed to get element text: ${getErrorMessage(error)}`);
    }
  }

  private async watch(): Promise<void> {
    const intervalMs = parseInterval(this.config.interval);
    
    while (this.isWatching) {
      try {
        await this.loadPage();

        const rawText = await this.getElementText();
        const currentText = this.normalizeText(rawText);
        console.log(formatLog('Current content:'), currentText);

        if (currentText !== this.lastText) {
          console.log(formatLog('Content change detected!'));
          console.log(formatLog('Previous content:'), this.lastText);
          console.log(formatLog('New content:'), currentText);
          
          const changeEvent: DOMChangeEvent = {
            timestamp: Date.now(),
            oldText: this.lastText ?? undefined,
            newText: currentText,
            url: this.config.url,
            selector: this.config.selector,
          };
          
          this.emit('change', changeEvent);
          this.lastText = currentText;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error: unknown) {
        if (!this.isWatching) return;
        
        console.error(formatLog('Error during watch:'), getErrorMessage(error));
        
        if (this.config.retryOnError) {
          console.log(formatLog('Retrying in 5 seconds...'));
          await new Promise(resolve => setTimeout(resolve, 5000));
          try {
            await this.cleanup();
            await this.start();
          } catch (retryError) {
            console.error(formatLog('Failed to retry:'), getErrorMessage(retryError));
          }
        } else {
          this.isWatching = false;
          await this.cleanup();
          throw error;
        }
      }
    }
  }

  on<K extends keyof DOMWatcherEvents>(
    event: K,
    listener: DOMWatcherEvents[K]
  ): this {
    return super.on(event, listener);
  }

  emit<K extends keyof DOMWatcherEvents>(
    event: K,
    ...args: Parameters<DOMWatcherEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}