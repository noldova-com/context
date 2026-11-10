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
import { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
import type { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
import { StartedSession } from "@noldova/context.data.sql.postgresql/models/started-session.js";
import { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";

import { FakeSocket } from "./fake-socket.fixture.js";

export class FakePoolStarter extends SessionStarter {
  public readonly socket: FakeSocket = new FakeSocket();
  public readonly cancelled: BackendKey[] = [];
  public cancelError: Error | null = null;
  public cancelPending: Promise<void> | null = null;
  public stopped: boolean = false;
  private readonly started: Promise<StartedSession>;
  private resolver: (session: StartedSession) => void = () => undefined;
  private rejecter: (error: unknown) => void = () => undefined;

  public constructor(options: ConnectionOptions) {
    super(options);
    this.started = new Promise<StartedSession>((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;
    });
  }

  public override startAsync(): Promise<StartedSession> {
    return this.started;
  }

  public override stop(): void {
    this.stopped = true;
    this.rejecter(new DataException("stopped"));
  }

  public override cancelAsync(backend: BackendKey, _signal: AbortSignal): Promise<void> {
    this.cancelled.push(backend);
    if (!Object.isNull(this.cancelPending))
      return this.cancelPending;

    return Object.isNull(this.cancelError) ? Promise.resolve() : Promise.reject(this.cancelError);
  }

  public open(parameters: ReadonlyMap<string, string> = new Map([["server_version", "17"]])): void {
    this.resolver(new StartedSession(this.socket, Buffer.alloc(0), parameters, new BackendKey(7, 9), "I", "localhost", 5432, this));
  }

  public fail(error: unknown): void {
    this.rejecter(error);
  }
}
