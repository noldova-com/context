/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";

import type { ConnectionSocket } from "./client/connection-socket.js";
import type { SessionStarter } from "../services/session-starter.js";
import type { BackendKey } from "./backend-key.js";

export class StartedSession {
  public readonly socket: ConnectionSocket;
  public readonly rest: Buffer;
  public readonly parameters: ReadonlyMap<string, string>;
  public readonly backend: BackendKey;
  public readonly status: string;
  public readonly host: string;
  public readonly port: number;
  private readonly starter: SessionStarter;

  public constructor(
    socket: ConnectionSocket, rest: Buffer, parameters: ReadonlyMap<string, string>, backend: BackendKey, status: string, host: string, port: number,
    starter: SessionStarter) {
    this.socket = socket;
    this.rest = rest;
    this.parameters = parameters;
    this.backend = backend;
    this.status = status;
    this.host = host;
    this.port = port;
    this.starter = starter;
  }

  public cancelAsync(signal: AbortSignal): Promise<void> {
    return this.starter.cancelAsync(this.backend, signal);
  }
}
