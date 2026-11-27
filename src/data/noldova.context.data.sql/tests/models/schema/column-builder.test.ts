/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnBuilder } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ColumnBuilderTests {
  @TestMethod
  public producesARequiredColumnByDefault(): void {
    const column = new ColumnBuilder("name", "TEXT").toColumn();

    Assert.areEqual("name", column.name);
    Assert.areEqual("TEXT", column.type);
    Assert.isFalse(column.isNullable);
    Assert.isNull(column.defaultValueSql);
  }

  @TestMethod
  public quotesATextDefaultAndWritesANumberAsItIs(): void {
    const builder = new ColumnBuilder("title", "TEXT");

    Assert.areEqual(builder, builder.hasDefaultValue("it's"));
    Assert.areEqual("'it''s'", builder.toColumn().defaultValueSql);
    Assert.areEqual("0", new ColumnBuilder("count", "INTEGER").hasDefaultValue(0).toColumn().defaultValueSql);
    Assert.areEqual("''", new ColumnBuilder("body", "TEXT").hasDefaultValue("").toColumn().defaultValueSql);
  }

  @TestMethod
  public takesADefaultWrittenAsSql(): void {
    const builder = new ColumnBuilder("createdAt", "TEXT");

    Assert.areEqual(builder, builder.hasDefaultValueSql("CURRENT_TIMESTAMP"));
    Assert.areEqual("CURRENT_TIMESTAMP", builder.toColumn().defaultValueSql);
    Assert.areEqual("sql", Assert.throws(() => builder.hasDefaultValueSql(" "), ArgumentException).parameterName);
  }

  @TestMethod
  public carriesNullableIntoTheColumn(): void {
    const builder = new ColumnBuilder("title", "TEXT");

    Assert.areEqual(builder, builder.makeNullable());
    Assert.isTrue(builder.toColumn().isNullable);
  }

  @TestMethod
  public validatesWhenTheColumnIsProduced(): void {
    Assert.throws(() => new ColumnBuilder(" ", "TEXT").toColumn(), ArgumentException);
  }
}
