/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType, SqlDialect } from "@noldova/context.data.sql";
import { PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PostgreSQLDialectTests {
  @TestMethod
  public spellsTransactionsColumnTypesKeysAndLocks(): void {
    const dialect = new PostgreSQLDialect();

    Assert.isInstanceOf(dialect, SqlDialect);
    Assert.areEqual("BEGIN", dialect.formatBeginTransaction());
    Assert.areEqual("TEXT", dialect.formatColumnType(ColumnType.Text));
    Assert.areEqual("BIGINT", dialect.formatColumnType(ColumnType.Integer));
    Assert.areEqual("BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY", dialect.formatIdentityColumnType());
    Assert.areEqual("SELECT pg_advisory_xact_lock(hashtext('__migrations'))", dialect.formatLock("__migrations").join(";"));
    Assert.areEqual("SELECT pg_advisory_xact_lock(hashtext('a''b'))", dialect.formatLock("a'b").join(";"));
  }
}
