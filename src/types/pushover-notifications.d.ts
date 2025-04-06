declare module 'pushover-notifications' {
  interface PushoverConfig {
    user: string;
    token: string;
  }

  interface PushoverMessage {
    title?: string;
    message: string;
    url?: string;
    url_title?: string;
    priority?: number;
    device?: string;
    sound?: string;
  }

  type PushCallback = (error: Error | null, result: unknown) => void;

  class Push {
    constructor(config: PushoverConfig);
    send(msg: PushoverMessage, callback: PushCallback): void;
  }

  export = Push;
}