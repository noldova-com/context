/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { BackendMessage } from "../enums/backend-message.js";
import { SslMode } from "../enums/ssl-mode.js";
import { ConnectionClosedException } from "../exceptions/connection-closed.exception.js";
import { MalformedMessageException } from "../exceptions/malformed-message.exception.js";
import { PostgreSQLException } from "../exceptions/postgresql.exception.js";
import { BackendKey } from "../models/backend-key.js";
import { ClientTimers } from "../models/client/client-timers.js";
import type { ConnectionOptions } from "../models/connection-options.js";
import { StartedSession } from "../models/started-session.js";
import { Resources } from "../resources.js";
import { Authenticator } from "./authenticator.js";
import type { DerivedKeys } from "./derived-keys.js";
import { PostgreSQLSocket } from "../models/postgresql-socket.js";
import { Backend } from "./protocol/backend.js";
import { FrameReader } from "./protocol/frame.reader.js";
import { Frontend } from "./protocol/frontend.js";
import { TlsOptionsReader } from "./tls-options.reader.js";

export class SessionStarter {
  private static readonly sslAccepted: number = 83;
  private static readonly sslRefused: number = 78;
  private static readonly keepAliveSeconds: number = 60;

  private readonly options: ConnectionOptions;
  private readonly keys: DerivedKeys;
  private readonly cancelTimeout: number;
  private readonly timers: ClientTimers;
  private readonly frontend: Frontend = new Frontend();
  private readonly abort: AbortController = new AbortController();
  private socket: PostgreSQLSocket | null = null;

  public constructor(options: ConnectionOptions, keys: DerivedKeys, cancelTimeout: number = 0, timers: ClientTimers = new ClientTimers()) {
    this.options = options;
    this.keys = keys;
    this.cancelTimeout = cancelTimeout;
    this.timers = timers;
  }

  public async startAsync(): Promise<StartedSession> {
    const timer = this.options.connectTimeout > 0 ? this.timers.setTimeout(() => this.stop(), this.options.connectTimeout * 1000) : null;
    try {
      this.socket = await PostgreSQLSocket.connectAsync(this.options.host, this.options.port, this.abort.signal);
      return await this.openAsync(this.socket);
    }
    catch (error) {
      this.socket?.destroy();
      throw this.abort.signal.aborted ? new DataException(Resources.connectTimeout, new ExceptionOptions(error)) : error;
    }
    finally {
      this.timers.clearTimeout(timer);
    }
  }

  public cancelAsync(backend: BackendKey, signal: AbortSignal): Promise<void> {
    const limit = this.cancelTimeout || this.options.connectTimeout;
    const abort = new AbortController();
    const sockets: PostgreSQLSocket[] = [];
    return new Promise<void>((resolve, reject) => {
      let written = false;
      let settled = false;
      let timer: number | null = null;
      const done = (error: unknown): void => {
        if (settled)
          return;

        settled = true;
        this.timers.clearTimeout(timer);
        signal.removeEventListener("abort", stopped);
        abort.abort();
        sockets.forEach(socket => socket.destroy());
        if (Object.isNull(error))
          resolve();
        else
          reject(error);
      };
      const stopped = (): void => done(signal.reason);
      signal.addEventListener("abort", stopped, { once: true });
      if (limit > 0)
        timer = this.timers.setTimeout(() => done(written ? null : new DataException(Resources.connectTimeout)), limit * 1000);

      PostgreSQLSocket.connectAsync(this.options.host, this.options.port, AbortSignal.any([abort.signal, signal])).then(async connected => {
        sockets.push(connected);
        await this.negotiateAsync(connected);
        connected.onClose = () => done(null);
        written = true;
        connected.end(this.frontend.cancel(backend.pid, backend.secret));
      }).catch(done);
    });
  }

  public stop(): void {
    this.abort.abort();
    this.socket?.destroy();
  }

  private async openAsync(socket: PostgreSQLSocket): Promise<StartedSession> {
    socket.keepAlive(SessionStarter.keepAliveSeconds);
    await this.negotiateAsync(socket);
    return this.runStartupAsync(socket);
  }

  private async negotiateAsync(socket: PostgreSQLSocket): Promise<void> {
    if (this.options.sslMode === SslMode.Disable)
      return;

    const answer = new Promise<Buffer>((resolve, reject) => {
      socket.onData = data => resolve(data);
      socket.onClose = error => reject(error ?? new ConnectionClosedException(false, this.options.host, this.options.port, null));
    });
    socket.write(this.frontend.createSslRequest());
    const [answered, ...others] = await answer;
    if (others.length > 0 || (answered !== SessionStarter.sslAccepted && answered !== SessionStarter.sslRefused))
      throw new MalformedMessageException();

    if (answered === SessionStarter.sslAccepted) {
      await socket.upgradeAsync(await TlsOptionsReader.readAsync(this.options));
      return;
    }

    if (this.options.sslMode !== SslMode.Prefer)
      throw new DataException(Resources.sslNotSupported);
  }

  private async runStartupAsync(socket: PostgreSQLSocket): Promise<StartedSession> {
    const authenticator = new Authenticator(this.options.user, this.options.password, this.options.channelBinding, socket.readPeerCertificate(), this.frontend, this.keys);
    const parameters = new Map<string, string>();
    let backend = new BackendKey(0, 0);
    return new Promise<StartedSession>((resolve, reject) => {
      let authenticating: Promise<void> = Promise.resolve();
      const fail = (error: unknown): void => {
        reject(error);
        socket.destroy();
      };
      const frames = new FrameReader((type, data, start, end) => {
        try {
          if (type === BackendMessage.Authentication) {
            const body = Buffer.from(data.subarray(start + 9, end));
            const authType = Backend.readAuthenticationType(data, start, end);
            authenticating = authenticating.then(async () => {
              const reply = await authenticator.respondAsync(authType, body);
              if (!Object.isNull(reply))
                socket.write(reply);
            });
            authenticating.catch(fail);
          }
          else if (type === BackendMessage.ParameterStatus) {
            const status = Backend.readParameterStatus(data, start, end);
            parameters.set(status.name, status.value);
          }
          else if (type === BackendMessage.BackendKeyData)
            backend = Backend.readBackendKeyData(data, start, end);
          else if (type === BackendMessage.ErrorResponse)
            fail(new PostgreSQLException(Backend.readError(data, start, end)));
          else if (type === BackendMessage.ReadyForQuery) {
            frames.pause();
            const status = Backend.readReadyForQuery(data, start, end);
            authenticating.then(() => {
              if (!authenticator.isAuthenticated) {
                fail(new DataException(Resources.authenticationIncomplete));
                return;
              }

              socket.onData = () => undefined;
              socket.onClose = () => undefined;
              socket.pause();
              resolve(new StartedSession(socket, frames.takeRemainder(), parameters, backend, status, this.options.host, this.options.port, this));
            }, () => undefined);
          }
        }
        catch (error) {
          fail(error);
        }
      }, fail);
      socket.onData = data => frames.push(data);
      socket.onClose = error => fail(error ?? new ConnectionClosedException(false, this.options.host, this.options.port, null));
      const startup = new Map([...this.options.parameters, ["user", this.options.user], ["database", this.options.database], ["client_encoding", "UTF8"]]);
      socket.write(this.frontend.createStartup(startup));
    });
  }
}
