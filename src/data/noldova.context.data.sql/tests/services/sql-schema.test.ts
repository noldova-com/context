/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { SqlSchema, type Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { LibraryContext } from "../fixtures/library-context.fixture.js";
import { ShapeSnapshot } from "../fixtures/shape-snapshot.fixture.js";
import { TestDialect } from "../fixtures/test-dialect.fixture.js";

@TestClass
export class SqlSchemaTests {
  @TestMethod
  public async mapsEachEntityOfTheModelToItsTableAsync(): Promise<void> {
    await using context = new LibraryContext();

    const tables = SqlSchema.fromModel(context.model, new TestDialect());

    Assert.areEqual("Writer: id INTEGER NOT NULL DEFAULT 0, name TEXT NOT NULL DEFAULT '', bio TEXT NULL DEFAULT ''; key id"
      + " | Book: id INTEGER NOT NULL DEFAULT 0, title TEXT NOT NULL DEFAULT '', writerId INTEGER NOT NULL DEFAULT 0; key id; writerId > Writer.id",
      tables.map(t => SqlSchemaTests.describe(t)).join(" | "));
  }

  @TestMethod
  public mapsEachEntityOfTheSnapshotToItsTable(): void {
    const snapshot = new ShapeSnapshot(t => {
      t.entity("Region").toTable("regions").property("code", PropertyType.String, "region_code").property("year", PropertyType.Integer).hasKey("code", "year");
      t.entity("Office").property("id", PropertyType.Integer).optionalProperty("name", PropertyType.String)
        .property("regionCode", PropertyType.String, "region").property("regionYear", PropertyType.Integer).hasKey("id")
        .hasForeignKey("Region", "regionCode", "regionYear");
      t.entity("Log").optionalProperty("text", PropertyType.String);
    });

    const tables = SqlSchema.fromSnapshot(snapshot, new TestDialect());

    Assert.areEqual("regions: region_code TEXT NOT NULL, year INTEGER NOT NULL; key region_code, year"
      + " | Office: id INTEGER NOT NULL, name TEXT NULL, region TEXT NOT NULL, regionYear INTEGER NOT NULL; key id; region > regions.region_code; regionYear > regions.year"
      + " | Log: text TEXT NULL",
      tables.map(t => SqlSchemaTests.describe(t)).join(" | "));
  }

  @TestMethod
  public requiresAnOptionalKeyPropertysColumn(): void {
    const tables = SqlSchema.fromSnapshot(new ShapeSnapshot(t => t.entity("Tag").optionalProperty("name", PropertyType.String).hasKey("name")), new TestDialect());

    Assert.areEqual("Tag: name TEXT NOT NULL; key name", tables.map(t => SqlSchemaTests.describe(t)).join(" | "));
  }

  private static describe(table: Table): string {
    const columns = table.columns.map(t => `${t.name} ${t.type} ${t.isNullable ? "NULL" : "NOT NULL"}${Object.isNull(t.defaultValueSql) ? "" : ` DEFAULT ${t.defaultValueSql}`}`);
    const parts = [`${table.name}: ${columns.join(", ")}`];
    if (!Object.isNull(table.primaryKey))
      parts.push(`key ${table.primaryKey.columns.join(", ")}`);
    for (const foreignKey of table.foreignKeys)
      parts.push(`${foreignKey.column} > ${foreignKey.principalTable}.${foreignKey.principalColumn}`);

    return parts.join("; ");
  }
}
