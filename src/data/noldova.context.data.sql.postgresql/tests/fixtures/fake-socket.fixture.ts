/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { setImmediate } from "node:timers";

import { ConnectionSocket } from "@noldova/context.data.sql.postgresql/models/client/connection-socket.js";

import { BackendMessages } from "./backend-messages.fixture.js";

export class FakeSocket extends ConnectionSocket {
  public readonly written: Buffer[] = [];
  public ended: Buffer | null = null;
  public destroyed: boolean = false;
  public paused: boolean = true;
  public referenced: boolean = true;
  public accepts: boolean = true;
  private readonly shared: boolean;
  private closed: boolean = false;

  public constructor(shared: boolean = false) {
    super();
    this.shared = shared;
  }

  public override get isClosed(): boolean {
    return this.closed;
  }

  public override get isShared(): boolean {
    return this.shared;
  }

  public override write(data: Buffer): boolean {
    this.written.push(data);
    return this.accepts;
  }

  public override end(data: Buffer): void {
    this.ended = data;
    this.close(null);
  }

  public override destroy(error: Error | null = null): void {
    this.destroyed = true;
    this.close(error);
  }

  public override pause(): void {
    this.paused = true;
  }

  public override resume(): void {
    this.paused = false;
  }

  public override ref(): void {
    this.referenced = true;
  }

  public override unref(): void {
    this.referenced = false;
  }

  public receive(...messages: Buffer[]): void {
    this.onData(Buffer.concat(messages));
  }

  public close(error: Error | null): void {
    if (this.closed)
      return;

    this.closed = true;
    this.onClose(error);
  }

  public peek(): string {
    return BackendMessages.types(Buffer.concat(this.written));
  }

  public take(): string {
    const types = this.peek();
    this.written.length = 0;
    return types;
  }

  public bytes(): Buffer {
    const data = Buffer.concat(this.written);
    this.written.length = 0;
    return data;
  }

  public async waitForAsync(condition: () => boolean): Promise<boolean> {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (condition())
        return true;
      await new Promise<void>(resolve => setImmediate(resolve));
    }

    return condition();
  }
}
