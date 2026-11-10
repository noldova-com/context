/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
import { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
import { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
import { SystemCertificates } from "@noldova/context.data.sql.postgresql/models/system-certificates.js";
import type { StartedSession } from "@noldova/context.data.sql.postgresql/models/started-session.js";
import { PostgreSQLSocket } from "@noldova/context.data.sql.postgresql/models/postgresql-socket.js";
import { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../fixtures/backend-messages.fixture.js";
import { type FakePeer, FakeServer } from "../fixtures/fake-server.fixture.js";
import { PostgreSQLServerFixture } from "../fixtures/postgresql-server.fixture.js";
import { Released } from "../fixtures/released.fixture.js";
import { ScramServer } from "../fixtures/scram-server.fixture.js";
import { TestCertificate } from "../fixtures/test-certificate.fixture.js";

@TestClass
export class SessionStarterTests {
  private static readonly mechanisms: string = "SCRAM-SHA-256-PLUS\0SCRAM-SHA-256\0\0";

  @TestMethod
  public async startsASessionWithTheServerAndCancelsOnItAsync(): Promise<void> {
    const server = PostgreSQLServerFixture.current();
    const starter = new SessionStarter(SessionStarterTests.real(SslMode.Prefer, 5, new Map([["application_name", "noldova-tests"]])));

    const session = await starter.startAsync();
    const secure = SessionStarterTests.secure(session);
    await session.cancelAsync(new AbortController().signal);
    await SessionStarterTests.endAsync(session);

    Assert.areEqual("I", session.status);
    Assert.areEqual("noldova-tests", session.parameters.get("application_name"));
    Assert.isTrue((session.parameters.get("server_version") ?? "").length > 0);
    Assert.isTrue(session.backend.pid > 0);
    Assert.areEqual(server.host, session.host);
    Assert.areEqual(server.port, session.port);
    Assert.isFalse(secure);
  }

  @TestMethod
  public async startsWithoutAskingForSslWhenItIsDisabledAsync(): Promise<void> {
    const starter = new SessionStarter(SessionStarterTests.real(SslMode.Disable, 0), 5);

    const session = await starter.startAsync();

    Assert.areEqual("I", session.status);
    await starter.cancelAsync(new BackendKey(session.backend.pid, session.backend.secret), new AbortController().signal);
    await SessionStarterTests.endAsync(session);
  }

  @TestMethod
  public async refusesARequiredSslTheServerLacksAsync(): Promise<void> {
    const starter = new SessionStarter(SessionStarterTests.real(SslMode.Require, 0));

    const error = await Assert.throwsAsync(() => starter.startAsync(), DataException);
    const cancel = await Assert.throwsAsync(() => starter.cancelAsync(new BackendKey(1, 2), new AbortController().signal), DataException);

    Assert.areEqual("The server does not support SSL connections.", error.message);
    Assert.areEqual("The server does not support SSL connections.", cancel.message);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async passesOnTheFatalErrorOfAnUnknownDatabaseAsync(): Promise<void> {
    const server = PostgreSQLServerFixture.current();
    const options = new ConnectionOptions(
      server.host, server.port, "noldova_missing_database", server.user, "", SslMode.Disable, ChannelBinding.Prefer, 0, new Map(), new SystemCertificates());

    const error = await Assert.throwsAsync(() => new SessionStarter(options).startAsync(), PostgreSQLException);

    Assert.areEqual("3D000", error.sqlState);
    Assert.areEqual("FATAL", error.severity);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async reportsAStopDuringConnectAsATimeoutAsync(): Promise<void> {
    const starter = new SessionStarter(SessionStarterTests.real(SslMode.Disable, 0));

    const started = starter.startAsync();
    starter.stop();
    const error = await Assert.throwsAsync(() => started, DataException);

    Assert.areEqual("The connection to the PostgreSQL server timed out.", error.message);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async timesOutAServerThatNeverAnswersAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.ssl = "silent";
    const starter = new SessionStarter(SessionStarterTests.fake(server, SslMode.Prefer, ChannelBinding.Prefer, "", 0.01));

    const error = await Assert.throwsAsync(() => starter.startAsync(), DataException);
    const cancel = await Assert.throwsAsync(() => starter.cancelAsync(new BackendKey(1, 2), new AbortController().signal), DataException);

    Assert.areEqual("The connection to the PostgreSQL server timed out.", error.message);
    Assert.isInstanceOf(error.cause, Error);
    Assert.areEqual("The connection to the PostgreSQL server timed out.", cancel.message);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async treatsACancelTheServerKeepsAsSentAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.onCancel = () => undefined;
    const starter = new SessionStarter(SessionStarterTests.fake(server, SslMode.Prefer, ChannelBinding.Prefer, "", 0), 0.01);

    await starter.cancelAsync(new BackendKey(5, 6), new AbortController().signal);

    Assert.areEqual("5:6", server.cancels.join(","));
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async closesACancelTheServerNeverAnswersOnceAbortedAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.onCancel = () => undefined;
    const starter = new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0), 0);
    const abort = new AbortController();
    const reason = new Error("The pool was destroyed.");

    const cancel = Assert.throwsAsync(() => starter.cancelAsync(new BackendKey(5, 6), abort.signal), Error);
    await SessionStarterTests.untilAsync(() => server.cancels.length === 1);
    abort.abort(reason);
    const error = await cancel;

    Assert.isTrue(error === reason);
    Assert.areEqual("5:6", server.cancels.join(","));
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async rejectsACancelThatCannotConnectAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const options = SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0);
    await SessionStarterTests.closeAsync(server);

    const error = await Assert.throwsAsync(() => new SessionStarter(options).cancelAsync(new BackendKey(1, 2), new AbortController().signal), Error);

    Assert.areEqual("ECONNREFUSED", "code" in error ? error.code : undefined);
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async bindsScramToTheServerCertificateOverTlsAsync(): Promise<void> {
    const certificate = TestCertificate.create();
    const server = await FakeServer.startAsync(certificate);
    server.ssl = "accept";
    const scram = SessionStarterTests.scram(server, "pencil");
    const starter = new SessionStarter(SessionStarterTests.fake(server, SslMode.Require, ChannelBinding.Require, "pencil", 0));

    const session = await starter.startAsync();

    Assert.areEqual("SCRAM-SHA-256-PLUS", scram.mechanism);
    Assert.areEqual("p=tls-server-end-point,,", scram.header);
    Assert.areEqual(createHash("sha256").update(certificate.der).digest("hex"), scram.binding.toString("hex"));
    Assert.isTrue(scram.verified);
    Assert.areEqual("app", server.peers[0]?.parameters.get("user"));
    Assert.areEqual("UTF8", server.peers[0]?.parameters.get("client_encoding"));
    Assert.isTrue(server.peers[0]?.secure ?? false);
    Assert.isTrue(SessionStarterTests.secure(session));
    Assert.areEqual(42, session.backend.pid);
    Assert.areEqual(43, session.backend.secret);
    Assert.areEqual("17", session.parameters.get("server_version"));
    await starter.cancelAsync(session.backend, new AbortController().signal);
    Assert.areEqual("42:43", server.cancels.join(","));
    await SessionStarterTests.endAsync(session);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async refusesAWrongPasswordAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const scram = SessionStarterTests.scram(server, "pencil");

    const error = await Assert.throwsAsync(
      () => new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "crayon", 0)).startAsync(), PostgreSQLException);

    Assert.isFalse(scram.verified);
    Assert.areEqual("28P01", error.sqlState);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async refusesAServerThatSkipsAuthenticationAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.onStartup = peer => peer.send(M.readyForQuery());

    const error = await Assert.throwsAsync(
      () => new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0)).startAsync(), DataException);

    Assert.areEqual("The server was ready before it accepted the authentication.", error.message);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async refusesAnAuthenticationItCannotAnswerAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.onStartup = peer => peer.send(peer.authentication(7), M.readyForQuery());

    const error = await Assert.throwsAsync(
      () => new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0)).startAsync(), DataException);

    Assert.isTrue(error.message.includes("7"));
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async answersACleartextPasswordRequestAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const passwords: string[] = [];
    server.onStartup = peer => peer.send(peer.authentication(3));
    server.onMessage = (peer, type, body) => {
      passwords.push(`${type}:${body.toString("utf8", 0, body.length - 1)}`);
      peer.ready();
    };
    const starter = new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "pencil", 0));

    const session = await starter.startAsync();

    Assert.areEqual("p:pencil", passwords.join(","));
    await SessionStarterTests.endAsync(session);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async keepsWhatTheServerSentAfterItWasReadyAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.onStartup = peer => peer.send(
      peer.authentication(0), M.backendKeyData(1, 2), M.readyForQuery("I"), M.parameterStatus("TimeZone", "UTC"));

    const session = await new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0)).startAsync();

    Assert.areEqual(M.parameterStatus("TimeZone", "UTC").toString("hex"), session.rest.toString("hex"));
    await SessionStarterTests.endAsync(session);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async failsWhenTheServerClosesOrBreaksTheStartupAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const options = SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0);

    server.onStartup = peer => peer.socket.end();
    const closed = await Assert.throwsAsync(() => new SessionStarter(options).startAsync(), ConnectionClosedException);
    server.onStartup = peer => peer.send(Buffer.from([0x52, 0, 0, 0, 1]));
    const broken = await Assert.throwsAsync(() => new SessionStarter(options).startAsync(), DataException);
    server.ssl = "refuse";
    server.onStartup = () => undefined;
    const answered = new SessionStarter(SessionStarterTests.fake(server, SslMode.Prefer, ChannelBinding.Prefer, "", 0)).startAsync();
    const reset = Assert.throwsAsync(() => answered, Error);
    await SessionStarterTests.untilAsync(() => server.peers.length === 3 && server.peers[2]?.parameters.has("user") === true);
    server.peers[2]?.socket.resetAndDestroy();
    const failure = await reset;

    Assert.isNull(closed.cause ?? null);
    Assert.isTrue(broken.message.length > 0);
    Assert.areEqual("ECONNRESET", "code" in failure ? failure.code : undefined);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async failsWhenTheServerClosesDuringSslNegotiationAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.ssl = "silent";
    const options = SessionStarterTests.fake(server, SslMode.Prefer, ChannelBinding.Prefer, "", 0);

    const started = new SessionStarter(options).startAsync();
    const closed = Assert.throwsAsync(() => started, ConnectionClosedException);
    await SessionStarterTests.untilAsync(() => server.peers.length === 1);
    server.peers[0]?.socket.end();

    Assert.isInstanceOf(await closed, ConnectionClosedException);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async refusesASelfSignedCertificateWhenItVerifiesAsync(): Promise<void> {
    const server = await FakeServer.startAsync(TestCertificate.create());
    server.ssl = "accept";

    const error = await Assert.throwsAsync(
      () => new SessionStarter(SessionStarterTests.fake(server, SslMode.VerifyFull, ChannelBinding.Prefer, "", 0)).startAsync(), Error);

    Assert.areEqual("DEPTH_ZERO_SELF_SIGNED_CERT", "code" in error ? error.code : undefined);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async timesOutATlsHandshakeTheServerNeverAnswersAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.ssl = "ignore";

    const error = await Assert.throwsAsync(
      () => new SessionStarter(SessionStarterTests.fake(server, SslMode.Require, ChannelBinding.Prefer, "", 0.05)).startAsync(), DataException);

    Assert.areEqual("The connection to the PostgreSQL server timed out.", error.message);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async leavesAStartedSessionQuietUntilItIsTakenAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const session = await new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0)).startAsync();
    const peer = server.peers[0];

    session.socket.resume();
    peer?.send(M.notice("late"));
    await SessionStarterTests.untilAsync(() => false);
    peer?.destroy();
    await SessionStarterTests.untilAsync(() => session.socket.isClosed);

    Assert.isTrue(session.socket.isClosed);
    await SessionStarterTests.closeAsync(server);
  }

  @TestMethod
  public async failsOnAnAuthenticationMessageTooShortToReadAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.onStartup = peer => peer.send(M.message("R"));

    const error = await Assert.throwsAsync(
      () => new SessionStarter(SessionStarterTests.fake(server, SslMode.Disable, ChannelBinding.Prefer, "", 0)).startAsync(), RangeError);

    Assert.isTrue(error.message.length > 0);
    await SessionStarterTests.closeAsync(server);
  }

  private static scram(server: FakeServer, password: string): ScramServer {
    const scram = new ScramServer(password);
    server.onStartup = peer => peer.send(peer.authentication(10, SessionStarterTests.mechanisms));
    server.onMessage = (peer: FakePeer, _type: string, body: Buffer) => {
      if (scram.mechanism.length === 0) {
        peer.send(peer.authentication(11, scram.first(body)));
        return;
      }

      const signature = scram.final(body);
      if (Object.isNull(signature))
        peer.send(M.error("28P01", "password authentication failed", "FATAL"));
      else {
        peer.send(peer.authentication(12, signature));
        peer.ready();
      }
    };
    return scram;
  }

  private static secure(session: StartedSession): boolean {
    return session.socket instanceof PostgreSQLSocket && session.socket.isSecure;
  }

  private static real(sslMode: SslMode, connectTimeout: number, parameters: ReadonlyMap<string, string> = new Map()): ConnectionOptions {
    const server = PostgreSQLServerFixture.current();
    return new ConnectionOptions(server.host, server.port, server.database, server.user, "", sslMode, ChannelBinding.Prefer, connectTimeout, parameters, new SystemCertificates());
  }

  private static fake(server: FakeServer, sslMode: SslMode, binding: ChannelBinding, password: string, connectTimeout: number): ConnectionOptions {
    return new ConnectionOptions("127.0.0.1", server.port, "app", "app", password, sslMode, binding, connectTimeout, new Map(), new SystemCertificates());
  }

  private static async endAsync(session: StartedSession): Promise<void> {
    session.socket.destroy();
    Assert.isTrue(await Released.socketsAsync() || session.socket.isClosed);
  }

  private static async closeAsync(server: FakeServer): Promise<void> {
    await server.closeAsync();
    Assert.isTrue(await Released.socketsAsync());
  }

  private static async untilAsync(condition: () => boolean): Promise<void> {
    for (let turn = 0; turn < 1000 && !condition(); turn += 1)
      await new Promise<void>(resolve => {
        setImmediate(resolve);
      });
  }
}
