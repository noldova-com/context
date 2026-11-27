/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { Column, SqlDialect } from "@noldova/context.data.sql";
import { PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PostgreSQLDialectTests {
  @TestMethod
  public spellsTransactionsColumnTypesKeysAndLocks(): void {
    const dialect = new PostgreSQLDialect();

    Assert.isInstanceOf(dialect, SqlDialect);
    Assert.areEqual("BEGIN", dialect.formatBeginTransaction());
    Assert.areEqual("TEXT", dialect.formatColumnType(PropertyType.String));
    Assert.areEqual("BIGINT", dialect.formatColumnType(PropertyType.Integer));
    Assert.areEqual("BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY", dialect.formatIdentityColumnType());
    Assert.areEqual("SELECT pg_advisory_xact_lock(hashtext('__migrations'))", dialect.formatLock("__migrations").join(";"));
    Assert.areEqual("SELECT pg_advisory_xact_lock(hashtext('a''b'))", dialect.formatLock("a'b").join(";"));
  }

  @TestMethod
  public altersAColumnsTypeAndNullabilityInPlace(): void {
    const dialect = new PostgreSQLDialect();

    Assert.areEqual("ALTER TABLE \"notes\" ALTER COLUMN \"rank\" DROP DEFAULT, ALTER COLUMN \"rank\" TYPE BIGINT USING \"rank\"::BIGINT, "
      + "ALTER COLUMN \"rank\" DROP NOT NULL",
      dialect.renderAlterColumn("notes", new Column("rank", "BIGINT", true)));
    Assert.areEqual("ALTER TABLE \"notes\" ALTER COLUMN \"title\" DROP DEFAULT, ALTER COLUMN \"title\" TYPE TEXT USING \"title\"::TEXT, "
      + "ALTER COLUMN \"title\" SET NOT NULL",
      dialect.renderAlterColumn("notes", new Column("title", "TEXT", false)));
    Assert.areEqual("ALTER TABLE \"notes\" ALTER COLUMN \"title\" DROP DEFAULT, ALTER COLUMN \"title\" TYPE TEXT USING COALESCE(\"title\"::TEXT, ''), "
      + "ALTER COLUMN \"title\" SET DEFAULT '', ALTER COLUMN \"title\" SET NOT NULL", dialect.renderAlterColumn("notes", new Column("title", "TEXT", false, "''")));
    Assert.areEqual("ALTER TABLE \"notes\" ALTER COLUMN \"rank\" DROP DEFAULT, ALTER COLUMN \"rank\" TYPE BIGINT USING \"rank\"::BIGINT, "
      + "ALTER COLUMN \"rank\" SET DEFAULT 0, ALTER COLUMN \"rank\" DROP NOT NULL", dialect.renderAlterColumn("notes", new Column("rank", "BIGINT", true, "0")));
  }
}
