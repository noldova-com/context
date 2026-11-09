/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { RowMode } from "@noldova/context.data.sql.postgresql/enums/row-mode.js";
import { Column } from "@noldova/context.data.sql.postgresql/models/column.js";
import { RowReader } from "@noldova/context.data.sql.postgresql/services/client/row.reader.js";
import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";

@TestClass
export class RowReaderTests {
  private static readonly number: ValueParser = (text: string): unknown => Number(text);

  @TestMethod
  public keepsTheColumnsWhenNoParserChanges(): void {
    const columns = [new Column("a", RowReaderTests.number, null, 0, 1, 23), new Column("b", null, null, 0, 2, 25)];

    Assert.areEqual(columns, RowReader.readColumns(columns, column => column.parser));
    Assert.areEqual(columns, RowReader.readColumns(columns, new Map([[1700, RowReaderTests.number]])));
  }

  @TestMethod
  public swapsParsersByFunctionAndReusesTheVariant(): void {
    const upper: ValueParser = (text: string): unknown => text.toUpperCase();
    const columns = [new Column("a", RowReaderTests.number, null, 0, 1, 23), new Column("b", null, null, 0, 2, 25)];
    const choose = (column: Column): ValueParser | null => column.type === 25 ? upper : null;

    const swapped = RowReader.readColumns(columns, choose);

    Assert.areNotEqual(columns, swapped);
    Assert.isNull(swapped[0]?.parser);
    Assert.areEqual(upper, swapped[1]?.parser);
    Assert.areEqual(swapped, RowReader.readColumns(columns, choose));
  }

  @TestMethod
  public swapsParsersByTypeAndKeepsUnchangedColumns(): void {
    const upper: ValueParser = (text: string): unknown => text.toUpperCase();
    const untouched = new Column("c", null, null, 0, 3, 16);
    const columns = [new Column("a", RowReaderTests.number, null, 0, 1, 23), new Column("b", null, null, 0, 2, 25), untouched];

    const swapped = RowReader.readColumns(columns, new Map<number, ValueParser | null>([[23, null], [25, upper], [16, null]]));

    Assert.isNull(swapped[0]?.parser);
    Assert.areEqual(upper, swapped[1]?.parser);
    Assert.areEqual(untouched, swapped[2]);
  }

  @TestMethod
  public keepsOnlyTheLatestSixteenVariants(): void {
    const columns = [new Column("a", null, null, 0, 1, 25)];
    const parsers = Array.from({ length: 17 }, (_value, index): ValueParser => (text: string): unknown => text + index.toString());
    const first = RowReader.readColumns(columns, new Map([[25, parsers[0] ?? null]]));

    for (const parser of parsers.slice(1))
      RowReader.readColumns(columns, new Map([[25, parser]]));
    const again = RowReader.readColumns(columns, new Map([[25, parsers[0] ?? null]]));
    const latest = RowReader.readColumns(columns, new Map([[25, parsers[16] ?? null]]));

    Assert.areNotEqual(first, again);
    Assert.areEqual(parsers[0], again[0]?.parser);
    Assert.areEqual(latest, RowReader.readColumns(columns, new Map([[25, parsers[16] ?? null]])));
  }

  @TestMethod
  public readsARowAsAnObjectWithParsersDecodersAndNulls(): void {
    const decode = (data: Buffer, start: number, end: number): unknown => data.toString("utf8", start, end).toUpperCase();
    const columns = [
      new Column("id", RowReaderTests.number, null, 0, 1, 23),
      new Column("note", null, null, 0, 2, 25),
      new Column("code", null, decode, 0, 3, 25),
      new Column("__proto__", null, null, 0, 4, 25)
    ];
    const data = M.dataRow(["7", null, "ab", "own"]);

    const row = RowReader.read(data, 0, columns, RowMode.Object, null);

    Assert.isInstanceOf(row, Object);
    Assert.areEqual(7, Reflect.get(row, "id"));
    Assert.isNull(Reflect.get(row, "note"));
    Assert.areEqual("AB", Reflect.get(row, "code"));
    Assert.areEqual("own", Object.getOwnPropertyDescriptor(row, "__proto__")?.value);
    Assert.areEqual(Object.prototype, Object.getPrototypeOf(row));
  }

  @TestMethod
  public readsARowAsValuesThroughTheTransform(): void {
    const columns = [new Column("id", RowReaderTests.number, null, 0, 1, 23), new Column("note", null, null, 0, 2, 25)];
    const data = Buffer.concat([Buffer.from("pad"), M.dataRow(["7", null])]);

    const row = RowReader.read(data, 3, columns, RowMode.Values, (value, column) => `${column.name}=${String(value)}`);

    Assert.isTrue(Array.isArray(row));
    Assert.areEqual("id=7,note=null", Array.isArray(row) ? row.join(",") : "");
  }

  @TestMethod
  public readsARowRawAsCopiedBytes(): void {
    const columns = [new Column("id", RowReaderTests.number, null, 0, 1, 23), new Column("note", null, null, 0, 2, 25)];
    const data = M.dataRow(["7", null]);

    const row = RowReader.read(data, 0, columns, RowMode.Raw, null);
    data.fill(0);

    Assert.isTrue(Array.isArray(row));
    const first: unknown = Array.isArray(row) ? row[0] : null;
    Assert.isInstanceOf(first, Buffer);
    Assert.areEqual("7", first.toString("utf8"));
    Assert.isNull(Array.isArray(row) ? row[1] : undefined);
  }
}
