/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PostgreSQLExceptionTests {
  @TestMethod
  public readsEveryFieldTheServerSent(): void {
    const exception = new PostgreSQLException(new Map([
      ["message", "duplicate key"],
      ["code", "23505"],
      ["severity", "ERROR"],
      ["severity_local", "FEHLER"],
      ["detail", "Key (id)=(1) already exists."],
      ["hint", "Pick another id."],
      ["schema_name", "public"],
      ["table_name", "notes"],
      ["column_name", "id"],
      ["constraint_name", "notes_pkey"]
    ]));

    Assert.areEqual("duplicate key", exception.message);
    Assert.areEqual("PostgreSQLException", exception.name);
    Assert.areEqual("23505", exception.sqlState);
    Assert.areEqual("ERROR", exception.severity);
    Assert.areEqual("Key (id)=(1) already exists.", exception.detail);
    Assert.areEqual("Pick another id.", exception.hint);
    Assert.areEqual("public", exception.schemaName);
    Assert.areEqual("notes", exception.tableName);
    Assert.areEqual("id", exception.columnName);
    Assert.areEqual("notes_pkey", exception.constraintName);
  }

  @TestMethod
  public fallsBackWhenTheServerLeavesFieldsOut(): void {
    const local = new PostgreSQLException(new Map([["severity_local", "FEHLER"]]));
    const empty = new PostgreSQLException(new Map());

    Assert.areEqual("The server reported an error without a message.", local.message);
    Assert.areEqual("FEHLER", local.severity);
    Assert.areEqual("", empty.severity);
    Assert.areEqual("", empty.sqlState);
    Assert.isNull(empty.detail);
    Assert.isNull(empty.hint);
    Assert.isNull(empty.schemaName);
    Assert.isNull(empty.tableName);
    Assert.isNull(empty.columnName);
    Assert.isNull(empty.constraintName);
  }
}
