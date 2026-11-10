/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType } from "@noldova/context.data.sql";
import { SQLiteDialect } from "@noldova/context.data.sql.sqlite";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SQLiteDialectTests {
  @TestMethod
  public spellsTransactionsColumnTypesKeysAndLocks(): void {
    const dialect = new SQLiteDialect();

    Assert.areEqual("BEGIN IMMEDIATE", dialect.formatBeginTransaction());
    Assert.areEqual("TEXT", dialect.formatColumnType(ColumnType.Text));
    Assert.areEqual("INTEGER", dialect.formatColumnType(ColumnType.Integer));
    Assert.areEqual("INTEGER PRIMARY KEY AUTOINCREMENT", dialect.formatIdentityColumnType());
    Assert.areEqual(0, dialect.formatLock().length);
  }
}
