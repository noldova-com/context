/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";
import { connect as connectNet, isIP, type Socket } from "node:net";
import { connect as connectTls, type ConnectionOptions as TlsOptions, type TLSSocket } from "node:tls";

import { ConnectionSocket } from "./client/connection-socket.js";

export class PostgreSQLSocket extends ConnectionSocket {
  private socket: Socket | TLSSocket;
  private readonly host: string;
  private closed: boolean = false;
  private failure: Error | null = null;
  private secure: boolean = false;

  private constructor(socket: Socket, host: string) {
    super();
    this.socket = socket;
    this.host = host;
    this.listen();
  }

  public static async connectAsync(host: string, port: number, signal: AbortSignal): Promise<PostgreSQLSocket> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const socket = connectNet({ host, port, signal });
      socket.once("error", reject);
      socket.once("connect", () => {
        socket.off("error", reject);
        socket.setNoDelay(true);
        resolve(new PostgreSQLSocket(socket, host));
      });
    });
  }

  public override get isClosed(): boolean {
    return this.closed;
  }

  public override get isShared(): boolean {
    return false;
  }

  public get isSecure(): boolean {
    return this.secure;
  }

  public override write(data: Buffer): boolean {
    return !this.closed && this.socket.write(data);
  }

  public override end(data: Buffer): void {
    if (!this.closed)
      this.socket.end(data);
  }

  public override destroy(error: Error | null = null): void {
    this.failure ??= error;
    this.socket.destroy();
  }

  public override pause(): void {
    this.socket.pause();
  }

  public override resume(): void {
    this.socket.resume();
  }

  public override ref(): void {
    this.socket.ref();
  }

  public override unref(): void {
    this.socket.unref();
  }

  public keepAlive(seconds: number): void {
    this.socket.setKeepAlive(true, 1000 * seconds);
  }

  public readPeerCertificate(): Buffer | null {
    if (!("getPeerX509Certificate" in this.socket))
      return null;

    return this.socket.getPeerX509Certificate()?.raw ?? null;
  }

  public async upgradeAsync(options: TlsOptions): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.unlisten();
      const secure = connectTls({
        socket: this.socket,
        host: this.host,
        ...isIP(this.host) === 0 ? { servername: this.host } : {},
        ...options
      });
      const fail = (error: Error): void => {
        secure.off("secureConnect", ready);
        reject(error);
      };
      const ready = (): void => {
        secure.off("error", fail);
        this.socket = secure;
        this.secure = true;
        this.listen();
        resolve();
      };
      secure.once("secureConnect", ready);
      secure.once("error", fail);
    });
  }

  private readonly data = (data: Buffer): void => {
    this.onData(data);
  };

  private readonly drain = (): void => {
    this.onDrain();
  };

  private readonly error = (error: Error): void => {
    this.failure ??= error;
    this.socket.destroy();
    this.close();
  };

  private readonly close = (): void => {
    if (this.closed)
      return;

    this.closed = true;
    this.onClose(this.failure);
  };

  private listen(): void {
    this.socket.on("data", this.data);
    this.socket.on("drain", this.drain);
    this.socket.on("error", this.error);
    this.socket.on("close", this.close);
  }

  private unlisten(): void {
    this.socket.off("data", this.data);
    this.socket.off("drain", this.drain);
    this.socket.off("error", this.error);
    this.socket.off("close", this.close);
  }
}
