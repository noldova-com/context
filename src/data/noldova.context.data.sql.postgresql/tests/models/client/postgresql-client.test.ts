/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ArgumentException } from "@noldova/context.exceptions";
import { ConnectionEndedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-ended.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryCanceledException } from "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js";
import { TypeDefinition } from "@noldova/context.data.sql.postgresql/models/type-definition.js";
import { PostgreSQLClient } from "@noldova/context.data.sql.postgresql/models/client/postgresql-client.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { HoldingTimers } from "../../fixtures/holding-timers.fixture.js";
import { PostgreSQLServerFixture } from "../../fixtures/postgresql-server.fixture.js";
import { RealClient } from "../../fixtures/real-client.fixture.js";
import { Released } from "../../fixtures/released.fixture.js";

@TestClass
export class PostgreSQLClientTests {
  @TestMethod
  public async runsTextWithValuesTypedAndJsonParametersAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      const prepared = await client.query("select $1::int4 as n, $2::text as t", [1, "a"]);
      const typed = await client.query("select $1 as n", [client.createTypedParameter(5, 23)]);
      const json = await client.query("select $1 as doc", [client.createJsonParameter({ a: [1] })]);
      const unsafe = await client.runUnsafe("select $1::int4 + 1 as n", [3]);
      const simple = await client.runUnsafe("select 1 as a; select 2 as b");
      const named = await client.runUnsafe("select 1 as " + client.formatIdentifier("we\"ird"));

      Assert.areEqual(JSON.stringify([{ n: 1, t: "a" }]), JSON.stringify(prepared));
      Assert.areEqual(5, RealClient.field(typed, "n"));
      Assert.areEqual(JSON.stringify({ a: [1] }), JSON.stringify(RealClient.field(json, "doc")));
      Assert.areEqual(4, RealClient.field(unsafe, "n"));
      Assert.areEqual(JSON.stringify([[{ a: 1 }], [{ b: 2 }]]), JSON.stringify(simple));
      Assert.areEqual(1, RealClient.field(named, "we\"ird"));
      Assert.areEqual("\"a\".\"b\"\"c\"", client.formatIdentifier("a", "b\"c"));
      Assert.throws(() => client.formatIdentifier(), ArgumentException);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async refusesUndefinedValuesUnlessTheTransformReplacesThemAsync(): Promise<void> {
    const client = RealClient.create();
    const replacing = RealClient.create({ transform: { undefined: null } });
    const inferring = RealClient.create({ infer: true });
    try {
      await Assert.throwsAsync(async () => {
        await client.query("select $1::int4 as n", [undefined]);
      }, DataException);
      await Assert.throwsAsync(async () => {
        await client.runUnsafe("select 1", new Array<number>(65534).fill(1));
      }, DataException);
      const replaced = await replacing.query("select $1::int4 as n, $2 as m", [undefined, replacing.createTypedParameter(undefined, 23)]);
      const inferred = await inferring.query("select pg_typeof($1)::text as t", [true]);

      Assert.isNull(RealClient.field(replaced, "n"));
      Assert.isNull(RealClient.field(replaced, "m"));
      Assert.areEqual("boolean", RealClient.field(inferred, "t"));
    }
    finally {
      await Promise.all([client.endAsync(), replacing.endAsync(), inferring.endAsync()]);
    }
  }

  @TestMethod
  public async runsABatchAndRefusesWhatABatchCannotHoldAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      const results = RealClient.list(await client.batch([client.query("select 1 as a"), client.query("select $1::int4 as b", [2])]));
      const ran = client.query("select 1");
      await ran;
      const cursor = client.query("select 1");
      cursor.iterateCursor();

      Assert.areEqual(JSON.stringify([[{ a: 1 }], [{ b: 2 }]]), JSON.stringify(results));
      Assert.areEqual("queries", Assert.throws(() => client.batch([ran]), ArgumentException).parameterName);
      Assert.areEqual("queries", Assert.throws(() => client.batch([cursor]), ArgumentException).parameterName);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async readsTheQueryFromAFileAsync(): Promise<void> {
    const folder = await mkdtemp(join(tmpdir(), "noldova-context-"));
    const client = RealClient.create();
    try {
      const path = join(folder, "query.sql");
      await writeFile(path, "select $1::int4 * 2 as n");
      const doubled = await client.runFile(path, [21]);
      await writeFile(path, "select 1 as a; select 2 as b");
      const simple = await client.runFile(path);

      Assert.areEqual(42, RealClient.field(doubled, "n"));
      Assert.areEqual(2, RealClient.list(simple).length);
      await Assert.throwsAsync(async () => {
        await client.runFile(join(folder, "missing.sql"));
      }, Error);
      const cancelled = client.runFile(path);
      await cancelled.cancelAsync();
      await Assert.throwsAsync(async () => {
        await cancelled;
      }, QueryCanceledException);
    }
    finally {
      await client.endAsync();
      await rm(folder, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async reservesOneConnectionUntilReleasedAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      const reserved = await client.reserveAsync();
      const first = RealClient.field(await reserved.runUnsafe("select pg_backend_pid() as pid"), "pid");
      const second = RealClient.field(await reserved.query("select pg_backend_pid() as pid"), "pid");
      await reserved[Symbol.asyncDispose]();
      const other = await client.reserveAsync();
      other[Symbol.dispose]();
      other.release();

      Assert.areEqual(first, second);
      Assert.areEqual(0, client.stats.leased);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async reportsParametersAndStatsAndEndsAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      await client.query("select 1");
      await client.closeAsync();
      await client.query("select 1");

      Assert.isTrue(client.parameters.has("server_version"));
      Assert.isTrue(client.stats.connections >= 1);
      Assert.areEqual(PostgreSQLServerFixture.current().port, client.connection.port);
      Assert.areEqual(10, client.options.max);
    }
    finally {
      await client[Symbol.asyncDispose]();
    }

    await Assert.throwsAsync(async () => {
      await client.query("select 1");
    }, ConnectionEndedException);
  }

  @TestMethod
  public async listensNotifiesAndUnlistensAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      const first = Promise.withResolvers<string>();
      const second = Promise.withResolvers<string>();
      let listened = 0;
      const one = await client.listenAsync("client_channel", payload => first.resolve(payload), () => {
        listened += 1;
      });
      const two = await client.listenAsync("client_channel", payload => second.resolve(payload));
      await client.notifyAsync("client_channel", 42);

      Assert.areEqual("42", await first.promise);
      Assert.areEqual("42", await second.promise);
      Assert.areEqual(1, listened);
      Assert.isNotNull(one.state);
      await one.unlistenAsync();
      await one.unlistenAsync();
      await two.unlistenAsync();
      await Assert.throwsAsync(() => client.listenAsync("", () => undefined), PostgreSQLException);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async listensAgainAfterTheConnectionIsLostAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      let listened = 0;
      const again = Promise.withResolvers<void>();
      const received = Promise.withResolvers<string>();
      const subscription = await client.listenAsync("lost_channel", payload => received.resolve(payload), () => {
        listened += 1;
        if (listened === 2)
          again.resolve();
      });
      const before = subscription.state;
      Assert.isNotNull(before);
      await client.runUnsafe("select pg_terminate_backend($1)", [before.pid]);
      await again.promise;
      await client.notifyAsync("lost_channel", "back");

      Assert.areEqual("back", await received.promise);
      Assert.isFalse(subscription.state?.pid === before.pid);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async endsWhileListeningAndIgnoresALaterUnlistenAsync(): Promise<void> {
    const client = RealClient.create();
    const subscription = await client.listenAsync("ending_channel", () => undefined);
    await client.endAsync();
    await subscription.unlistenAsync();
    await client.endAsync();

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async holdsTheProcessOpenWhileListeningAsync(): Promise<void> {
    const timers = new HoldingTimers(2 ** 30);
    const client = RealClient.create({ timers });
    try {
      const subscription = await client.listenAsync("held_channel", () => undefined);
      Assert.areEqual(1, timers.held.size);
      timers.fire();
      Assert.areEqual(1, timers.held.size);
      await subscription.unlistenAsync();
      Assert.areEqual(0, timers.held.size);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public refusesNamedTypesWithoutFetchingTypes(): void {
    const failure = Assert.throws(() => PostgreSQLClient.create(RealClient.location(), {
      types: [new TypeDefinition("public.thing", [], null, null)], fetchTypes: false
    }), ArgumentException);

    Assert.areEqual("types", failure.parameterName);
  }
}
