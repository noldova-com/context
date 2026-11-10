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
import { PostgreSQLException } from "../exceptions/postgresql.exception.js";
import { BackendKey } from "../models/backend-key.js";
import type { ConnectionOptions } from "../models/connection-options.js";
import { StartedSession } from "../models/started-session.js";
import { Resources } from "../resources.js";
import { Authenticator } from "./authenticator.js";
import { PostgreSQLSocket } from "../models/postgresql-socket.js";
import { Backend } from "./protocol/backend.js";
import { FrameReader } from "./protocol/frame.reader.js";
import { Frontend } from "./protocol/frontend.js";
import { TlsOptionsReader } from "./tls-options.reader.js";

export class SessionStarter {
  private static readonly sslAccepted: number = 83;
  private static readonly keepAliveSeconds: number = 60;

  private readonly options: ConnectionOptions;
  private readonly cancelTimeout: number;
  private readonly frontend: Frontend = new Frontend();
  private readonly abort: AbortController = new AbortController();
  private socket: PostgreSQLSocket | null = null;

  public constructor(options: ConnectionOptions, cancelTimeout: number = 0) {
    this.options = options;
    this.cancelTimeout = cancelTimeout;
  }

  public async startAsync(): Promise<StartedSession> {
    const timer = this.options.connectTimeout > 0 ? setTimeout(() => this.stop(), this.options.connectTimeout * 1000) : undefined;
    try {
      this.socket = await PostgreSQLSocket.connectAsync(this.options.host, this.options.port, this.abort.signal);
      return await this.openAsync(this.socket);
    }
    catch (error) {
      this.socket?.destroy();
      throw this.abort.signal.aborted ? new DataException(Resources.connectTimeout, new ExceptionOptions(error)) : error;
    }
    finally {
      clearTimeout(timer);
    }
  }

  public cancelAsync(backend: BackendKey, signal: AbortSignal): Promise<void> {
    const limit = this.cancelTimeout || this.options.connectTimeout;
    const abort = new AbortController();
    const sockets: PostgreSQLSocket[] = [];
    return new Promise<void>((resolve, reject) => {
      let written = false;
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const done = (error: unknown): void => {
        if (settled)
          return;

        settled = true;
        clearTimeout(timer);
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
        timer = setTimeout(() => done(written ? null : new DataException(Resources.connectTimeout)), limit * 1000);

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

    const answer = new Promise<number>((resolve, reject) => {
      socket.onData = data => resolve(data.readUInt8(0));
      socket.onClose = error => reject(error ?? new ConnectionClosedException(false, this.options.host, this.options.port, null));
    });
    socket.write(this.frontend.createSslRequest());
    if (await answer === SessionStarter.sslAccepted) {
      await socket.upgradeAsync(await TlsOptionsReader.readAsync(this.options));
      return;
    }

    if (this.options.sslMode !== SslMode.Prefer)
      throw new DataException(Resources.sslNotSupported);
  }

  private async runStartupAsync(socket: PostgreSQLSocket): Promise<StartedSession> {
    const authenticator = new Authenticator(this.options.user, this.options.password, this.options.channelBinding, socket.readPeerCertificate(), this.frontend);
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
            const authType = Backend.readAuthenticationType(data, start);
            authenticating = authenticating.then(() => {
              const reply = authenticator.respond(authType, body);
              if (!Object.isNull(reply))
                socket.write(reply);
            });
            authenticating.catch(fail);
          }
          else if (type === BackendMessage.ParameterStatus) {
            const [name, value] = Backend.readParameterStatus(data, start);
            parameters.set(name, value);
          }
          else if (type === BackendMessage.BackendKeyData)
            backend = Backend.readBackendKeyData(data, start);
          else if (type === BackendMessage.ErrorResponse)
            fail(new PostgreSQLException(Backend.readError(data, start, end)));
          else if (type === BackendMessage.ReadyForQuery) {
            const rest = Buffer.from(data.subarray(end));
            const status = Backend.readReadyForQuery(data, start);
            authenticating.then(() => {
              if (!authenticator.isAuthenticated) {
                fail(new DataException(Resources.authenticationIncomplete));
                return;
              }

              socket.onData = () => undefined;
              socket.onClose = () => undefined;
              socket.pause();
              resolve(new StartedSession(socket, rest, parameters, backend, status, this.options.host, this.options.port, this));
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
