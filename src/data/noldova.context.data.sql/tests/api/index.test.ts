/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DataSqlApiTests {
  @TestMethod
  public exportsTheCompleteRuntimeSurface(): void {
    const expected = [
      "AddColumnOperation", "AddForeignKeyOperation", "AddPrimaryKeyOperation", "AlterColumnOperation", "Column", "ColumnBuilder", "ColumnsBuilder",
      "ConstraintsBuilder", "CreateIndexOperation", "CreateTableOperation", "DropColumnOperation", "DropForeignKeyOperation",
      "DropPrimaryKeyOperation", "DropTableOperation", "ForeignKey", "MigrationBuilder", "PrimaryKey", "SchemaDiffer", "SchemaMismatchException",
      "SchemaOperation", "SqlChangeFeed", "SqlConnection", "SqlDialect", "SqlMigration", "SqlMigrationHistory", "SqlMigrator", "SqlModelValidator",
      "SqlProvider", "SqlQuery", "SqlSchema", "SqlSession", "SqlStatementOperation", "SqlTransaction", "Table", "TableChangeOperation"
    ];

    Assert.areEqual(expected.join(","), Object.keys(api).sort().join(","));
  }
}
