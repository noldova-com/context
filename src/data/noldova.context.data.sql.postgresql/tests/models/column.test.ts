/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinaryColumns } from "@noldova/context.data.sql.postgresql/models/binary-columns.js";
import { Column } from "@noldova/context.data.sql.postgresql/models/column.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ColumnTests {
  @TestMethod
  public swapsItsDecoderAndKeepsTheRest(): void {
    const parser = (text: string): unknown => text.length;
    const decode = (): unknown => 1;
    const column = new Column("id", parser, null, 1259, 2, 23);

    const decoded = column.withDecoder(decode);

    Assert.areEqual(decode, decoded.decode);
    Assert.areEqual(parser, decoded.parser);
    Assert.areEqual("id", decoded.name);
    Assert.areEqual(1259, decoded.table);
    Assert.areEqual(2, decoded.number);
    Assert.areEqual(23, decoded.type);
    Assert.isNull(column.decode);
  }

  @TestMethod
  public swapsItsParserAndDropsTheDecoder(): void {
    const parser = (text: string): unknown => text.length;
    const column = new Column("id", null, () => 1, 1259, 2, 23);

    const parsed = column.withParser(parser);

    Assert.areEqual(parser, parsed.parser);
    Assert.isNull(parsed.decode);
    Assert.areEqual(23, parsed.type);
    Assert.isNull(column.withParser(null).parser);
  }

  @TestMethod
  public pairsBinaryColumnsWithTheirFormats(): void {
    const columns = [new Column("a", null, null, 0, 1, 23), new Column("b", null, null, 0, 2, 25)];

    const binary = new BinaryColumns(columns, [1, 0]);

    Assert.areEqual(columns, binary.columns);
    Assert.areEqual("1,0", binary.formats.join(","));
  }
}
