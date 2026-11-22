/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { TransactionRolledBackException } from "@noldova/context.data.sql.postgresql/exceptions/transaction-rolled-back.exception.js";
import { PostgreSQLClient } from "@noldova/context.data.sql.postgresql/models/client/postgresql-client.js";
import type { ClientSettings } from "@noldova/context.data.sql.postgresql/types/client-settings.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { type FakePeer, FakeServer } from "../../fixtures/fake-server.fixture.js";
import { LiveTimers } from "../../fixtures/live-timers.fixture.js";
import { Released } from "../../fixtures/released.fixture.js";
import { ScramServer } from "../../fixtures/scram-server.fixture.js";

@TestClass
export class PostgreSQLClientFakeTests {
  @TestMethod
  public async keepsTheKeysItsPoolsDeriveToSignInUntilItEndsAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const signIns = new Map<FakePeer, ScramServer>();
    server.onStartup = peer => peer.send(peer.authentication(10, "SCRAM-SHA-256\0\0"));
    server.onMessage = (peer, type, body) => PostgreSQLClientFakeTests.signIn(signIns, peer, type, body);
    const client = PostgreSQLClient.create(`postgres://app:pencil@127.0.0.1:${String(server.port)}/app`, { fetchTypes: false, maxLifetime: null, connectTimeout: 5 });
    try {
      await client.beginAsync(() => 1);
      await client.listenAsync("keys", () => undefined);
      const listenerKeys = client.listener.pool?.keys;
      const signedIn = [client.pool.keys.salted.size, listenerKeys?.salted.size];

      await client.endAsync(0);

      Assert.areEqual(JSON.stringify([1, 1]), JSON.stringify(signedIn));
      Assert.areEqual(0, client.pool.keys.salted.size);
      Assert.areEqual(0, listenerKeys?.salted.size);
      Assert.areEqual(2, signIns.size);
      Assert.isTrue([...signIns.values()].every(t => t.verified));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async failsWhenTheServerRollsBackInsteadOfCommittingAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    server.onMessage = (peer, type, body) => PostgreSQLClientFakeTests.answer(peer, type, body, texts, text => text === "commit" ? "ROLLBACK" : null);
    const client = PostgreSQLClientFakeTests.client(server);
    try {
      await Assert.throwsAsync(() => client.beginAsync(() => 1), TransactionRolledBackException);

      Assert.areEqual(JSON.stringify(["begin ", "commit"]), JSON.stringify(texts));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async preparesATwoPhaseTransactionAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    server.onMessage = (peer, type, body) => PostgreSQLClientFakeTests.answer(peer, type, body, texts, () => null);
    const client = PostgreSQLClientFakeTests.client(server);
    try {
      const value = await client.beginAsync(scope => {
        scope.prepare("tx'1 x;");
        return "prepared";
      });

      Assert.areEqual("prepared", value);
      Assert.areEqual(JSON.stringify(["begin ", "prepare transaction 'tx1 x'"]), JSON.stringify(texts));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async reportsAFailedUnlistenButNotALostConnectionAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    server.onMessage = (peer, type, body) => {
      const text = PostgreSQLClientFakeTests.text(type, body);
      if (text === "unlisten \"lost\"")
        peer.destroy();
      else if (text === "unlisten \"failing\"")
        peer.send(M.error("42000", "refused"), M.readyForQuery());
      else
        PostgreSQLClientFakeTests.answer(peer, type, body, texts, () => null);
    };
    const client = PostgreSQLClientFakeTests.client(server);
    try {
      const failing = await client.listenAsync("failing", () => undefined);
      const lost = await client.listenAsync("lost", () => undefined);

      await Assert.throwsAsync(() => failing.unlistenAsync(), PostgreSQLException);
      await lost.unlistenAsync();
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async listensAgainAfterAFixedBackoffAsync(): Promise<void> {
    await PostgreSQLClientFakeTests.relistenAsync({ backoff: 0 });
  }

  @TestMethod
  public async listensAgainAfterACalculatedBackoffAsync(): Promise<void> {
    const attempts: number[] = [];
    await PostgreSQLClientFakeTests.relistenAsync({
      backoff: retries => {
        attempts.push(retries);
        return 0;
      }
    });

    Assert.isTrue(attempts.includes(1));
  }

  @TestMethod
  public async dropsTheBackoffTimerWhenTheLastListenerLeavesAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    let listens = 0;
    server.onMessage = (peer, type, body) => {
      const listen = PostgreSQLClientFakeTests.text(type, body)?.startsWith("listen") === true;
      listens += listen ? 1 : 0;
      if (listen && listens > 1)
        peer.send(M.error("42501", "permission denied"), M.readyForQuery());
      else
        PostgreSQLClientFakeTests.answer(peer, type, body, [], () => null);
    };
    const timers = new LiveTimers();
    const retried = Promise.withResolvers<void>();
    const client = PostgreSQLClientFakeTests.client(server, {
      timers,
      backoff: () => {
        retried.resolve();
        return 60;
      }
    });
    try {
      const subscription = await client.listenAsync("again", () => undefined);
      server.peers[0]?.destroy();
      await retried.promise;
      const waiting = timers.count(60000);

      await subscription.unlistenAsync();

      Assert.areEqual(1, waiting);
      Assert.areEqual(0, timers.count(60000));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async endsTheSubscriptionWhoseHandlerThrowsAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    const unlistened = Promise.withResolvers<void>();
    server.onMessage = (peer, type, body) => {
      PostgreSQLClientFakeTests.answer(peer, type, body, texts, () => null);
      if (PostgreSQLClientFakeTests.text(type, body)?.startsWith("unlisten") === true)
        unlistened.resolve();
    };
    const client = PostgreSQLClientFakeTests.client(server);
    const failure = new DataException("handler");
    const last = new DataException("last");
    const received = Promise.withResolvers<void>();
    try {
      const failing = await client.listenAsync("jobs", () => {
        throw failure;
      });
      const kept = await client.listenAsync("jobs", payload => {
        if (payload === "last")
          throw last;
        if (payload === "second")
          received.resolve();
      });

      server.peers[0]?.send(M.notification(5, "jobs", "first"));
      const ended = await Assert.throwsAsync(() => failing.ended, DataException);
      server.peers[0]?.send(M.notification(5, "jobs", "second"));
      await received.promise;
      server.peers[0]?.send(M.notification(5, "jobs", "last"));
      const lastEnded = await Assert.throwsAsync(() => kept.ended, DataException);
      await unlistened.promise;

      Assert.isTrue(ended === failure);
      Assert.isTrue(lastEnded === last);
      Assert.areEqual(JSON.stringify(["listen \"jobs\"", "unlisten \"jobs\""]), JSON.stringify(texts));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async keepsTheHandlerErrorWhenTheUnlistenAfterItFailsAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    const refused = Promise.withResolvers<void>();
    server.onMessage = (peer, type, body) => {
      if (PostgreSQLClientFakeTests.text(type, body) === "unlisten \"jobs\"") {
        texts.push("unlisten \"jobs\"");
        peer.send(M.error("42000", "refused"), M.readyForQuery());
        refused.resolve();
      }
      else
        PostgreSQLClientFakeTests.answer(peer, type, body, texts, () => null);
    };
    const client = PostgreSQLClientFakeTests.client(server);
    const failure = new DataException("handler");
    try {
      const failing = await client.listenAsync("jobs", () => {
        throw failure;
      });

      server.peers[0]?.send(M.notification(5, "jobs", "first"));
      const ended = await Assert.throwsAsync(() => failing.ended, DataException);
      await refused.promise;
      const next = await client.listenAsync("next", () => undefined);
      await next.unlistenAsync();

      Assert.isTrue(ended === failure);
      Assert.areEqual(JSON.stringify(["listen \"jobs\"", "unlisten \"jobs\"", "listen \"next\"", "unlisten \"next\""]), JSON.stringify(texts));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async rejectsTheListenAndUnregistersWhenTheFirstOnlistenThrowsAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    const unlistened = Promise.withResolvers<void>();
    const delivered = Promise.withResolvers<string>();
    server.onMessage = (peer, type, body) => {
      PostgreSQLClientFakeTests.answer(peer, type, body, texts, () => null);
      if (PostgreSQLClientFakeTests.text(type, body)?.startsWith("unlisten") === true)
        unlistened.resolve();
    };
    const client = PostgreSQLClientFakeTests.client(server);
    const failure = new DataException("onlisten");
    try {
      const kept = await client.listenAsync("jobs", payload => delivered.resolve(payload));
      const error = await Assert.throwsAsync(() => client.listenAsync("jobs", () => undefined, () => {
        throw failure;
      }), DataException);
      const alone = await Assert.throwsAsync(() => client.listenAsync("alone", () => undefined, () => {
        throw failure;
      }), DataException);
      await unlistened.promise;
      server.peers[0]?.send(M.notification(5, "jobs", "after"));
      const payload = await delivered.promise;
      await kept.unlistenAsync();

      Assert.isTrue(error === failure);
      Assert.isTrue(alone === failure);
      Assert.areEqual("after", payload);
      Assert.areEqual(JSON.stringify(["listen \"jobs\"", "listen \"alone\"", "unlisten \"alone\"", "unlisten \"jobs\""]), JSON.stringify(texts));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async settlesEndedOnUnlistenAndOnEndAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    server.onMessage = (peer, type, body) => PostgreSQLClientFakeTests.answer(peer, type, body, [], () => null);
    const client = PostgreSQLClientFakeTests.client(server);
    try {
      const unlistened = await client.listenAsync("first", () => undefined);
      const open = await client.listenAsync("second", () => undefined);

      await unlistened.unlistenAsync();
      await unlistened.ended;
      await client.endAsync(0);
      await open.ended;
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async endsTheSubscriptionWhoseOnlistenThrowsWhenItListensAgainAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    const unlistened = Promise.withResolvers<void>();
    server.onMessage = (peer, type, body) => {
      PostgreSQLClientFakeTests.answer(peer, type, body, texts, () => null);
      if (PostgreSQLClientFakeTests.text(type, body)?.startsWith("unlisten") === true)
        unlistened.resolve();
    };
    const client = PostgreSQLClientFakeTests.client(server, { backoff: 0 });
    const failure = new DataException("onlisten");
    try {
      let listened = 0;
      const subscription = await client.listenAsync("again", () => undefined, () => {
        listened += 1;
        if (listened === 2)
          throw failure;
      });

      server.peers[0]?.destroy();
      const ended = await Assert.throwsAsync(() => subscription.ended, DataException);
      await unlistened.promise;

      Assert.isTrue(ended === failure);
      Assert.areEqual(JSON.stringify(["listen \"again\"", "listen \"again\"", "unlisten \"again\""]), JSON.stringify(texts));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async endsTheSubscriptionsWhenTheRelistenBackoffThrowsAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    let listens = 0;
    server.onMessage = (peer, type, body) => {
      const listen = PostgreSQLClientFakeTests.text(type, body)?.startsWith("listen") === true;
      listens += listen ? 1 : 0;
      if (listen && listens > 1)
        peer.send(M.error("42501", "permission denied"), M.readyForQuery());
      else
        PostgreSQLClientFakeTests.answer(peer, type, body, [], () => null);
    };
    const failure = new DataException("backoff");
    const client = PostgreSQLClientFakeTests.client(server, {
      backoff: () => {
        throw failure;
      }
    });
    try {
      const first = await client.listenAsync("again", () => undefined);
      const second = await client.listenAsync("again", () => undefined);

      server.peers[0]?.destroy();
      const ended = await Assert.throwsAsync(() => first.ended, DataException);
      const alsoEnded = await Assert.throwsAsync(() => second.ended, DataException);

      Assert.isTrue(ended === failure);
      Assert.isTrue(alsoEnded === failure);
      Assert.areEqual(2, listens);
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  private static async relistenAsync(settings: ClientSettings): Promise<void> {
    const server = await FakeServer.startAsync();
    const texts: string[] = [];
    server.onMessage = (peer, type, body) => PostgreSQLClientFakeTests.answer(peer, type, body, texts, () => null);
    const client = PostgreSQLClientFakeTests.client(server, settings);
    try {
      let listened = 0;
      const again = Promise.withResolvers<void>();
      await client.listenAsync("again", () => undefined, () => {
        listened += 1;
        if (listened === 2)
          again.resolve();
      });
      server.onStartup = peer => {
        server.onStartup = next => next.ready();
        peer.send(M.error("57P03", "starting up", "FATAL"));
        peer.socket.end();
      };
      server.peers[0]?.destroy();
      await again.promise;

      Assert.areEqual(3, server.peers.length);
      Assert.areEqual(JSON.stringify(["listen \"again\"", "listen \"again\""]), JSON.stringify(texts));
    }
    finally {
      await client.endAsync(0);
      await server.closeAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  private static client(server: FakeServer, settings: ClientSettings = {}): PostgreSQLClient {
    return PostgreSQLClient.create(`postgres://app@127.0.0.1:${String(server.port)}/app`, { fetchTypes: false, maxLifetime: null, connectTimeout: 5, ...settings });
  }

  private static signIn(signIns: Map<FakePeer, ScramServer>, peer: FakePeer, type: string, body: Buffer): void {
    if (type !== "p") {
      PostgreSQLClientFakeTests.answer(peer, type, body, [], () => null);
      return;
    }

    const scram = signIns.get(peer) ?? new ScramServer("pencil");
    signIns.set(peer, scram);
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
  }

  private static text(type: string, body: Buffer): string | null {
    return type === "Q" ? body.toString("utf8", 0, body.length - 1) : null;
  }

  private static answer(peer: FakePeer, type: string, body: Buffer, texts: string[], tag: (text: string) => string | null): void {
    const text = PostgreSQLClientFakeTests.text(type, body);
    if (Object.isNull(text))
      return;

    texts.push(text);
    const command = tag(text) ?? text.trim().split(" ").slice(0, text.startsWith("prepare") ? 2 : 1).join(" ").toUpperCase();
    peer.send(M.commandComplete(command), M.readyForQuery(text.startsWith("begin") ? "T" : "I"));
  }
}
