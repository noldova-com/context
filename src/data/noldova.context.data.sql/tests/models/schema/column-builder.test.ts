/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnBuilder, ColumnType } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ColumnBuilderTests {
  @TestMethod
  public producesARequiredColumnByDefault(): void {
    const column = new ColumnBuilder("name", ColumnType.Text).toColumn();

    Assert.areEqual("name", column.name);
    Assert.areEqual(ColumnType.Text, column.type);
    Assert.isFalse(column.isNullable);
  }

  @TestMethod
  public carriesNullableIntoTheColumn(): void {
    const builder = new ColumnBuilder("title", ColumnType.Text);

    Assert.areEqual(builder, builder.makeNullable());
    Assert.isTrue(builder.toColumn().isNullable);
  }

  @TestMethod
  public validatesWhenTheColumnIsProduced(): void {
    Assert.throws(() => new ColumnBuilder(" ", ColumnType.Text).toColumn(), ArgumentException);
  }
}
