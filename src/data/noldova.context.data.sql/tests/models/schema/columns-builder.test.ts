/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnsBuilder } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import type { Note } from "../../fixtures/note.fixture.js";

@TestClass
export class ColumnsBuilderTests {
  @TestMethod
  public namesColumnsBySelectorOrText(): void {
    const builder = new ColumnsBuilder<Note>();
    builder.addColumn(t => t.id, "TEXT");
    builder.addColumn(t => t.ownerId, "TEXT").makeNullable();
    builder.addColumn("json", "TEXT");
    builder.addColumn("count", "INTEGER");

    const columns = builder.toColumns();

    Assert.areEqual("id,ownerId,json,count", columns.map(t => t.name).join(","));
    Assert.isTrue(columns[1]?.isNullable === true);
    Assert.areEqual("INTEGER", columns[3]?.type);
  }

  @TestMethod
  public producesAFreshListEachTime(): void {
    const builder = new ColumnsBuilder<Note>();
    builder.addColumn(t => t.id, "TEXT");
    const columns = [...builder.toColumns()];
    columns.length = 0;

    Assert.areEqual(1, builder.toColumns().length);
  }
}
