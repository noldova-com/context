/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer as createNetServer, type Server, type Socket } from "node:net";
import { createServer as createTlsServer, type ConnectionOptions as TlsOptions } from "node:tls";

import "@noldova/context.core";
import { PostgreSQLSocket } from "@noldova/context.data.sql.postgresql/models/postgresql-socket.js";
import { Backend } from "@noldova/context.data.sql.postgresql/services/protocol/backend.js";
import { FrameReader } from "@noldova/context.data.sql.postgresql/services/protocol/frame.reader.js";
import { Frontend } from "@noldova/context.data.sql.postgresql/services/protocol/frontend.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { PostgreSQLServerFixture } from "../fixtures/postgresql-server.fixture.js";
import { Released } from "../fixtures/released.fixture.js";
import { TestCertificate } from "../fixtures/test-certificate.fixture.js";

@TestClass
export class PostgreSQLSocketTests {
  private static readonly cipher: string = "PSK-AES128-GCM-SHA256";

  @TestMethod
  public async startsASessionWithTheServerAndReportsItsCloseAsync(): Promise<void> {
    const server = PostgreSQLServerFixture.current();
    const frontend = new Frontend();
    const socket = await PostgreSQLSocket.connectAsync(server.host, server.port, new AbortController().signal);

    const answer = PostgreSQLSocketTests.received(socket);
    socket.write(frontend.createSslRequest());
    Assert.areEqual("N", (await answer).toString("utf8"));
    Assert.isFalse(socket.isSecure);
    Assert.isFalse(socket.isShared);
    Assert.isNull(socket.readPeerCertificate());

    socket.keepAlive(60);
    socket.unref();
    socket.ref();
    const ready = PostgreSQLSocketTests.frames(socket);
    socket.write(frontend.createStartup(new Map([["user", server.user], ["database", server.database]])));
    const frames = await ready;
    const first = frames[0] ?? Buffer.alloc(9);

    Assert.areEqual("R", String.fromCharCode(first.readUInt8(0)));
    Assert.areEqual(0, Backend.readAuthenticationType(first, 0));
    Assert.isTrue(frames.some(t => t.readUInt8(0) === 75));

    socket.pause();
    socket.resume();
    const answered = PostgreSQLSocketTests.frames(socket);
    socket.write(frontend.query("SELECT 1"));
    const rows = await answered;
    Assert.isTrue(rows.some(t => t.readUInt8(0) === 68));

    const closed = PostgreSQLSocketTests.closed(socket);
    socket.destroy();
    Assert.isNull(await closed);
    Assert.isTrue(socket.isClosed);
    Assert.isFalse(socket.write(frontend.sync()));
    Assert.doesNotThrow(() => socket.end(frontend.terminate()));
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async tellsWhenAFullWriteBufferDrainsAsync(): Promise<void> {
    let accept: (raw: Socket) => void = () => undefined;
    const accepted = new Promise<Socket>(resolve => {
      accept = resolve;
    });
    const server = createNetServer(raw => {
      raw.pause();
      accept(raw);
    });
    const port = await PostgreSQLSocketTests.listenAsync(server);
    const socket = await PostgreSQLSocket.connectAsync("127.0.0.1", port, new AbortController().signal);
    const peer = await accepted;
    const drained = new Promise<void>(resolve => {
      socket.onDrain = resolve;
    });

    let writes = 0;
    while (writes < 1024 && socket.write(Buffer.alloc(1024 * 1024)))
      writes += 1;
    peer.resume();
    await drained;

    Assert.isTrue(writes < 1024);
    const closed = PostgreSQLSocketTests.closed(socket);
    socket.destroy();
    Assert.isNull(await closed);
    peer.destroy();
    await PostgreSQLSocketTests.closeAsync(server);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async reportsAWriteAfterTheEndAsItsCloseAsync(): Promise<void> {
    const server = PostgreSQLServerFixture.current();
    const frontend = new Frontend();
    const socket = await PostgreSQLSocket.connectAsync(server.host, server.port, new AbortController().signal);
    const closed = PostgreSQLSocketTests.closed(socket);

    socket.end(frontend.terminate());
    Assert.isFalse(socket.write(frontend.sync()));
    const error = await closed;

    Assert.isInstanceOf(error, Error);
    Assert.areEqual("ERR_STREAM_WRITE_AFTER_END", "code" in error ? error.code : undefined);
    Assert.isTrue(socket.isClosed);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async keepsTheFirstErrorItWasDestroyedWithAsync(): Promise<void> {
    const server = PostgreSQLServerFixture.current();
    const frontend = new Frontend();
    const socket = await PostgreSQLSocket.connectAsync(server.host, server.port, new AbortController().signal);
    const closed = PostgreSQLSocketTests.closed(socket);
    const first = new Error("first");

    socket.end(frontend.terminate());
    socket.write(frontend.sync());
    socket.destroy(first);
    socket.destroy(new Error("second"));

    Assert.areEqual(first, await closed);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async closesWithoutAnErrorWhenDestroyedPlainlyAsync(): Promise<void> {
    const server = PostgreSQLServerFixture.current();
    const socket = await PostgreSQLSocket.connectAsync(server.host, server.port, new AbortController().signal);
    const closed = PostgreSQLSocketTests.closed(socket);

    socket.destroy();

    Assert.isNull(await closed);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async refusesAConnectNobodyAnswersAsync(): Promise<void> {
    const server = createNetServer();
    const port = await PostgreSQLSocketTests.listenAsync(server);
    await PostgreSQLSocketTests.closeAsync(server);

    const error = await Assert.throwsAsync(() => PostgreSQLSocket.connectAsync("127.0.0.1", port, new AbortController().signal), Error);

    Assert.areEqual("ECONNREFUSED", "code" in error ? error.code : undefined);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async opensNoSocketForAnAlreadyAbortedSignalAsync(): Promise<void> {
    const server = createNetServer();
    let connections = 0;
    server.on("connection", (socket: Socket) => {
      connections += 1;
      socket.destroy();
    });
    const port = await PostgreSQLSocketTests.listenAsync(server);
    const abort = new AbortController();
    const reason = new Error("aborted before connect");
    abort.abort(reason);

    const error = await Assert.throwsAsync(() => PostgreSQLSocket.connectAsync("127.0.0.1", port, abort.signal), Error);
    await PostgreSQLSocketTests.closeAsync(server);

    Assert.areEqual(reason, error);
    Assert.areEqual(0, connections);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async upgradesToTlsAndKeepsTalkingAsync(): Promise<void> {
    for (const host of ["127.0.0.1", "localhost"]) {
      const key = randomBytes(32);
      const names: string[] = [];
      const server = createTlsServer({
        ciphers: PostgreSQLSocketTests.cipher,
        maxVersion: "TLSv1.2",
        pskCallback: (_socket, identity) => {
          names.push(identity);
          return key;
        }
      }, secure => {
        secure.on("data", (data: Buffer) => secure.end(Buffer.concat([Buffer.from("echo:"), data])));
      });
      const port = await PostgreSQLSocketTests.listenAsync(server);
      const socket = await PostgreSQLSocket.connectAsync(host, port, new AbortController().signal);

      await socket.upgradeAsync(PostgreSQLSocketTests.client(key));
      Assert.isTrue(socket.isSecure);
      Assert.isNull(socket.readPeerCertificate());
      const answer = PostgreSQLSocketTests.received(socket);
      const closed = PostgreSQLSocketTests.closed(socket);
      socket.write(Buffer.from("ping"));

      Assert.areEqual("echo:ping", (await answer).toString("utf8"));
      Assert.isNull(await closed);
      Assert.areEqual("noldova-test", names.join(","));
      await PostgreSQLSocketTests.closeAsync(server);
      Assert.isTrue(await Released.socketsAsync());
    }
  }

  @TestMethod
  public async readsTheServerCertificateUntilTheSocketClosesAsync(): Promise<void> {
    const certificate = TestCertificate.create();
    const server = createTlsServer({ key: certificate.key, cert: certificate.certificate }, secure => {
      secure.on("data", () => secure.end());
    });
    const port = await PostgreSQLSocketTests.listenAsync(server);
    const socket = await PostgreSQLSocket.connectAsync("localhost", port, new AbortController().signal);

    await socket.upgradeAsync({ rejectUnauthorized: false });
    const presented = socket.readPeerCertificate();
    const closed = PostgreSQLSocketTests.closed(socket);
    socket.write(Buffer.from("bye"));
    Assert.isNull(await closed);

    Assert.isNotNull(presented);
    Assert.areEqual(certificate.der.toString("hex"), presented.toString("hex"));
    Assert.isNull(socket.readPeerCertificate());
    await PostgreSQLSocketTests.closeAsync(server);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async refusesAnUpgradeThePeerDoesNotSpeakAsync(): Promise<void> {
    const peers: Socket[] = [];
    const server = createNetServer(raw => {
      peers.push(raw);
      raw.once("data", () => raw.end("N"));
    });
    const port = await PostgreSQLSocketTests.listenAsync(server);
    const socket = await PostgreSQLSocket.connectAsync("127.0.0.1", port, new AbortController().signal);

    await Assert.throwsAsync(() => socket.upgradeAsync(PostgreSQLSocketTests.client(randomBytes(32))), Error);

    Assert.isFalse(socket.isSecure);
    socket.destroy();
    for (const peer of peers)
      peer.destroy();
    await PostgreSQLSocketTests.closeAsync(server);
    Assert.isTrue(await Released.socketsAsync());
  }

  private static client(key: Buffer): TlsOptions {
    return {
      ciphers: PostgreSQLSocketTests.cipher,
      maxVersion: "TLSv1.2",
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
      pskCallback: () => ({ psk: key, identity: "noldova-test" })
    };
  }

  private static received(socket: PostgreSQLSocket): Promise<Buffer> {
    return new Promise(resolve => {
      socket.onData = resolve;
    });
  }

  private static closed(socket: PostgreSQLSocket): Promise<Error | null> {
    return new Promise(resolve => {
      socket.onClose = resolve;
    });
  }

  private static frames(socket: PostgreSQLSocket): Promise<Buffer[]> {
    return new Promise((resolve, reject) => {
      const frames: Buffer[] = [];
      const reader = new FrameReader((_type, data, start, end) => {
        frames.push(Buffer.from(data.subarray(start, end)));
        if (data.readUInt8(start) === 90)
          resolve(frames);
      }, reject);
      socket.onData = data => reader.push(data);
    });
  }

  private static async listenAsync(server: Server): Promise<number> {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    return Object.isNull(address) || Object.isString(address) ? 0 : address.port;
  }

  private static async closeAsync(server: Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      server.close(error => Object.isUndefined(error) ? resolve() : reject(error));
    });
  }
}
