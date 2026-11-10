/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnsBuilder, ColumnType } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import type { Note } from "../../fixtures/note.fixture.js";

@TestClass
export class ColumnsBuilderTests {
  @TestMethod
  public namesColumnsBySelectorOrText(): void {
    const builder = new ColumnsBuilder<Note>();
    builder.addColumn(t => t.id, ColumnType.Text);
    builder.addColumn(t => t.ownerId, ColumnType.Text).makeNullable();
    builder.addColumn("json", ColumnType.Text);
    builder.addColumn("count", ColumnType.Integer);

    const columns = builder.toColumns();

    Assert.areEqual("id,ownerId,json,count", columns.map(t => t.name).join(","));
    Assert.isTrue(columns[1]?.isNullable === true);
    Assert.areEqual(ColumnType.Integer, columns[3]?.type);
  }

  @TestMethod
  public producesAFreshListEachTime(): void {
    const builder = new ColumnsBuilder<Note>();
    builder.addColumn(t => t.id, ColumnType.Text);
    const columns = [...builder.toColumns()];
    columns.length = 0;

    Assert.areEqual(1, builder.toColumns().length);
  }
}
