import express, { Application } from 'express';
import { defaultLogger, DomazeLogger } from "./logger";
import { domaze, DomazeProps } from "./middleware";
import * as http from 'http';
import { AddressInfo } from 'net';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import exitHook from './exit-hook';

export interface ServerProps extends DomazeProps {
  port?: number;
  trustProxy?: boolean;
  pageLimit?: TrafficLimit;
  mute?: boolean;
}

export interface TrafficLimit {
  windowMs: number,
  maxRequests: number,
}

export class Server {
  props: ServerProps;
  logger: DomazeLogger;
  server?: http.Server;
  port?: number;
  app?: Application;

  constructor(props: ServerProps) {
    props.ssr !== undefined || (props.ssr = true);
    props.csr !== undefined || (props.csr = true);
    this.props = props;
    this.logger = props.logger ?? props.mute ? () => {} : defaultLogger;
  }

  async start(): Promise<this> {
    if (this.server) {
      return this;
    }
    const config = this.props;
    const app = this.app = express();
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // see https://expressjs.com/en/guide/behind-proxies.html
    config.trustProxy && app.set('trust proxy', 1);
    //TODO: will this limit all requests with any extension because of the '*'?
    config.pageLimit && this.setLimiter(config.pageLimit, ['*', '*.html'], app);
    config.docroot ||= process.cwd();

    app.use(domaze(config));

    app.use(express.static(config.docroot));
    this.server = app.listen(config.port);
    this.port = (this.server?.address() as AddressInfo).port;
    this.logger('info', `[server] docroot ${config.docroot}`);
    this.logger('info', `[server] address http://127.0.0.1:${this.port}/`);
    exitHook(() => this.logger('info', '[server] will exit'));
    process.on('uncaughtException', (err) => {
      this.logger('error', err.stack ? err.stack : `${err}`);
    });
    return this;
  }

  async stop(): Promise<this> {
    return this;
  }

  setLimiter(limit: TrafficLimit, paths: Array<string>, app: Application) {
    const limiter = rateLimit({
      windowMs: limit.windowMs,
      max: limit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
    });
    for (const path of paths) {
      app.use(path, limiter);
    }
  }
}
