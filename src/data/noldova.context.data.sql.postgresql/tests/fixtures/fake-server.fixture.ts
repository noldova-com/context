/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import type { X509Certificate } from "node:crypto";
import { once } from "node:events";
import { createServer, type Server, type Socket } from "node:net";
import { TLSSocket } from "node:tls";

import "@noldova/context.core";

import { BackendMessages as M } from "./backend-messages.fixture.js";
import type { TestCertificate } from "./test-certificate.fixture.js";

export class FakePeer {
  public readonly parameters: Map<string, string> = new Map();
  public socket: Socket | TLSSocket;
  public secure: boolean = false;
  public client: X509Certificate | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private started: boolean = false;
  private readonly server: FakeServer;

  public constructor(socket: Socket, server: FakeServer) {
    this.socket = socket;
    this.server = server;
    this.listen();
  }

  public send(...messages: Buffer[]): void {
    this.socket.write(Buffer.concat(messages));
  }

  public authentication(type: number, data: Buffer | string = Buffer.alloc(0)): Buffer {
    const head = Buffer.alloc(4);
    head.writeInt32BE(type);
    return M.message("R", Buffer.concat([head, Buffer.from(data)]));
  }

  public ready(): void {
    this.send(this.authentication(0), M.parameterStatus("server_version", "17"), M.backendKeyData(42, 43), M.readyForQuery());
  }

  public destroy(): void {
    this.socket.destroy();
  }

  private listen(): void {
    this.socket.on("data", this.data);
    this.socket.on("error", () => undefined);
  }

  private readonly data = (chunk: Buffer): void => {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (let message = this.take(); !Object.isNull(message); message = this.take())
      if (this.handle(message))
        return;
  };

  private take(): Buffer | null {
    const head = this.started ? 1 : 0;
    if (this.buffer.length < head + 4)
      return null;

    const length = this.buffer.readInt32BE(head);
    if (this.buffer.length < head + length)
      return null;

    const message = this.buffer.subarray(0, head + length);
    this.buffer = this.buffer.subarray(head + length);
    return message;
  }

  private handle(message: Buffer): boolean {
    if (this.started) {
      this.server.onMessage(this, String.fromCharCode(message.readUInt8(0)), message.subarray(5));
      return false;
    }

    const code = message.readInt32BE(4);
    if (code === FakeServer.sslRequestCode)
      return this.negotiate();
    if (code === FakeServer.cancelRequestCode) {
      this.server.cancels.push(`${message.readInt32BE(8).toString()}:${message.readInt32BE(12).toString()}`);
      this.server.onCancel(this);
      return true;
    }

    const fields = message.toString("utf8", 8, message.length - 1).split("\0");
    for (let index = 0; index + 1 < fields.length; index += 2)
      this.parameters.set(fields[index] ?? "", fields[index + 1] ?? "");
    this.started = true;
    this.server.onStartup(this);
    return false;
  }

  private negotiate(): boolean {
    const answer = this.server.ssl;
    if (answer === "silent")
      return true;
    if (answer === "refuse") {
      this.socket.write("N");
      return false;
    }

    this.socket.write("S");
    if (answer === "ignore")
      return true;

    const certificate = this.server.certificate;
    if (Object.isNull(certificate))
      return true;

    this.socket.off("data", this.data);
    const authority = this.server.authority;
    const secure = new TLSSocket(this.socket, {
      isServer: true, key: certificate.key, cert: certificate.certificate,
      ...Object.isNull(authority) ? {} : { requestCert: true, rejectUnauthorized: true, ca: authority.certificate }
    });
    if (!Object.isNull(authority))
      secure.once("secure", () => this.verify(secure, authority));
    this.socket = secure;
    this.secure = true;
    this.buffer = Buffer.alloc(0);
    this.listen();
    return true;
  }

  private verify(secure: TLSSocket, authority: TestCertificate): void {
    const client = secure.getPeerX509Certificate() ?? null;
    if (Object.isNull(client) || !client.verify(authority.publicKey)) {
      secure.destroy();
      return;
    }

    this.client = client;
  }
}

export class FakeServer {
  public static readonly sslRequestCode: number = 80877103;
  public static readonly cancelRequestCode: number = 80877102;

  public readonly peers: FakePeer[] = [];
  public readonly cancels: string[] = [];
  public readonly certificate: TestCertificate | null;
  public readonly authority: TestCertificate | null;
  public ssl: "accept" | "refuse" | "silent" | "ignore" = "refuse";
  public onStartup: (peer: FakePeer) => void = peer => peer.ready();
  public onMessage: (peer: FakePeer, type: string, body: Buffer) => void = () => undefined;
  public onCancel: (peer: FakePeer) => void = peer => peer.socket.end();
  private readonly server: Server;

  private constructor(certificate: TestCertificate | null, authority: TestCertificate | null) {
    this.certificate = certificate;
    this.authority = authority;
    this.server = createServer({ allowHalfOpen: true }, socket => {
      this.peers.push(new FakePeer(socket, this));
    });
  }

  public get port(): number {
    const address = this.server.address();
    return Object.isNull(address) || Object.isString(address) ? 0 : address.port;
  }

  public static async startAsync(certificate: TestCertificate | null = null, authority: TestCertificate | null = null): Promise<FakeServer> {
    const server = new FakeServer(certificate, authority);
    server.server.listen(0, "127.0.0.1");
    await once(server.server, "listening");
    return server;
  }

  public async closeAsync(): Promise<void> {
    const closed = new Promise<void>((resolve, reject) => {
      this.server.close(error => Object.isUndefined(error) ? resolve() : reject(error));
    });
    for (const peer of this.peers)
      peer.destroy();
    await closed;
  }
}
