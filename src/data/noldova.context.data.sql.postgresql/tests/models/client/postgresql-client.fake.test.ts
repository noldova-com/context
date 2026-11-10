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
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { TransactionRolledBackException } from "@noldova/context.data.sql.postgresql/exceptions/transaction-rolled-back.exception.js";
import { PostgreSQLClient } from "@noldova/context.data.sql.postgresql/models/client/postgresql-client.js";
import type { ClientSettings } from "@noldova/context.data.sql.postgresql/types/client-settings.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { type FakePeer, FakeServer } from "../../fixtures/fake-server.fixture.js";
import { LiveTimers } from "../../fixtures/live-timers.fixture.js";
import { Released } from "../../fixtures/released.fixture.js";

@TestClass
export class PostgreSQLClientFakeTests {
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
