/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryCanceledException } from "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js";
import { TransactionRolledBackException } from "@noldova/context.data.sql.postgresql/exceptions/transaction-rolled-back.exception.js";
import { UnsafeTransactionException } from "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js";
import type { PostgreSQLClient } from "@noldova/context.data.sql.postgresql/models/client/postgresql-client.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RealClient } from "../../fixtures/real-client.fixture.js";
import { Released } from "../../fixtures/released.fixture.js";

@TestClass
export class TransactionScopeTests {
  @TestMethod
  public async commitsWhatTheCallbackReturnsAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      await client.runUnsafe("create table scope_commits (n int4)");
      const value = await client.beginAsync(async scope => {
        await scope.runUnsafe("insert into scope_commits values (1)");
        return 5;
      });
      const listed = await client.beginAsync(scope => [scope.query("select 1 as a"), scope.runUnsafe("select 2 as b")]);
      const mode = await client.beginAsync("isolation level serializable", async scope => RealClient.field(await scope.runUnsafe("show transaction_isolation"), "transaction_isolation"));

      Assert.areEqual(5, value);
      Assert.areEqual(JSON.stringify([[{ a: 1 }], [{ b: 2 }]]), JSON.stringify(listed));
      Assert.areEqual("serializable", mode);
      Assert.areEqual(1, await TransactionScopeTests.countAsync(client, "scope_commits"));
    }
    finally {
      await client.runUnsafe("drop table if exists scope_commits");
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async rollsBackWhenTheCallbackThrowsAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      await client.runUnsafe("create table scope_throws (n int4)");
      const failure = await Assert.throwsAsync(() => client.beginAsync(async scope => {
        await scope.runUnsafe("insert into scope_throws values (1)");
        throw new DataException("stop");
      }), DataException);
      await Assert.throwsAsync(() => client.beginAsync(scope => scope.beginAsync(inner => inner.prepare("x"))), UnsafeTransactionException);

      Assert.areEqual("stop", failure.message);
      Assert.areEqual(0, await TransactionScopeTests.countAsync(client, "scope_throws"));
    }
    finally {
      await client.runUnsafe("drop table if exists scope_throws");
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async throwsTheFirstFailureOfTheTransactionAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      const aborted = await Assert.throwsAsync(() => client.beginAsync(async scope => {
        void scope.runUnsafe("select 1/0").catch(() => null);
        await scope.runUnsafe("select 1");
      }), PostgreSQLException);
      const swallowed = await Assert.throwsAsync(() => client.beginAsync(async scope => {
        await scope.runUnsafe("select 1/0").catch(() => null);
        return 1;
      }), PostgreSQLException);

      await Assert.throwsAsync(() => client.beginAsync(async scope => {
        const query = scope.runUnsafe("select 1");
        await query.cancelAsync();
        await query;
      }), QueryCanceledException);

      Assert.areEqual("22012", aborted.sqlState);
      Assert.areEqual("22012", swallowed.sqlState);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async runsSavepointsAndNestedTransactionsAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      await client.runUnsafe("create table scope_savepoints (n int4)");
      await client.beginAsync("read write", async scope => {
        await scope.runUnsafe("insert into scope_savepoints values (1)");
        await scope.runInSavepointAsync(async inner => {
          await inner.runUnsafe("insert into scope_savepoints values (2)");
          throw new DataException("undo");
        }).catch(() => null);
        await scope.runInSavepointAsync("named", inner => inner.runUnsafe("insert into scope_savepoints values (3)"));
        await scope.beginAsync("READ  write!", inner => inner.runUnsafe("insert into scope_savepoints values (4)"));
        await scope.beginAsync(async inner => {
          await inner.runUnsafe("insert into scope_savepoints values (5)");
          await inner.rollbackAsync();
        });
        await Assert.throwsAsync(() => scope.beginAsync("read only", () => null), UnsafeTransactionException);
      });

      Assert.areEqual(JSON.stringify([{ n: 1 }, { n: 3 }, { n: 4 }]), JSON.stringify(await client.runUnsafe("select n from scope_savepoints order by n")));
    }
    finally {
      await client.runUnsafe("drop table if exists scope_savepoints");
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async rollsBackOnRequestAndRefusesLaterQueriesAsync(): Promise<void> {
    const client = RealClient.create();
    try {
      await client.runUnsafe("create table scope_rollbacks (n int4)");
      const kept = await client.beginAsync(async scope => {
        await scope.runUnsafe("insert into scope_rollbacks values (1)");
        const first = scope.rollbackAsync();
        Assert.areEqual(first, scope.rollbackAsync());
        await first;
        return "kept";
      });
      const refused = await Assert.throwsAsync(() => client.beginAsync(async scope => {
        await scope.rollbackAsync();
        await scope.runUnsafe("select 1").catch(() => null);
        await scope.runInSavepointAsync(() => null).catch(() => null);
      }), TransactionRolledBackException);
      const thrown = await Assert.throwsAsync(() => client.beginAsync(async scope => {
        await scope.rollbackAsync();
        throw new DataException("after");
      }), DataException);
      const inner = await client.beginAsync(async scope => scope.runInSavepointAsync(async () => {
        await scope.rollbackAsync();
        return "inner";
      }));

      const late = await Assert.throwsAsync(() => client.beginAsync(scope => scope.runInSavepointAsync(async savepoint => {
        await scope.rollbackAsync();
        await savepoint.rollbackAsync().catch(() => null);
        throw new DataException("late");
      })), DataException);

      Assert.areEqual("kept", kept);
      Assert.areEqual("late", late.message);
      Assert.areEqual("The query was not sent, because the transaction was rolled back with rollbackAsync.", refused.message);
      Assert.areEqual("after", thrown.message);
      Assert.areEqual("inner", inner);
      Assert.areEqual(0, await TransactionScopeTests.countAsync(client, "scope_rollbacks"));
    }
    finally {
      await client.runUnsafe("drop table if exists scope_rollbacks");
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async failsWhenTheConnectionIsLostAsync(): Promise<void> {
    const closed = Promise.withResolvers<void>();
    const client = RealClient.create({ onclose: () => closed.resolve() });
    try {
      const failure = await Assert.throwsAsync(() => client.beginAsync(async scope => {
        const pid = RealClient.field(await scope.runUnsafe("select pg_backend_pid() as pid"), "pid");
        await client.runUnsafe("select pg_terminate_backend($1)", [pid]);
        await closed.promise;
        return 1;
      }), Error);

      Assert.isTrue(failure instanceof DataException);
    }
    finally {
      await client.endAsync();
    }

    Assert.isTrue(await Released.socketsAsync());
  }

  private static async countAsync(client: PostgreSQLClient, table: string): Promise<unknown> {
    return RealClient.field(await client.runUnsafe("select count(*)::int4 as n from " + client.formatIdentifier(table)), "n");
  }
}
