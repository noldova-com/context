/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import "@noldova/context.core";

import { RowMode } from "../../enums/row-mode.js";
import type { Column } from "../../models/column.js";
import { Resources } from "../../resources.js";
import type { ValueParser } from "../../types/value-parser.js";
import { Backend } from "../protocol/backend.js";

class ParserVariant {
  public readonly parsers: readonly (ValueParser | null)[];
  public readonly columns: readonly Column[];

  public constructor(parsers: readonly (ValueParser | null)[], columns: readonly Column[]) {
    this.parsers = parsers;
    this.columns = columns;
  }
}

export class RowReader {
  private static readonly variety: number = 16;
  private static readonly variants: WeakMap<readonly Column[], ParserVariant[]> = new WeakMap();

  public static readColumns(columns: readonly Column[], parsers: ((column: Column) => ValueParser | null) | ReadonlyMap<number, ValueParser | null>): readonly Column[] {
    const list = columns.map(column => RowReader.findColumnParser(column, parsers));
    if (list.every((parser, index) => parser === columns[index]?.parser))
      return columns;

    let variants = RowReader.variants.get(columns);
    if (Object.isUndefined(variants)) {
      variants = [];
      RowReader.variants.set(columns, variants);
    }

    const found = variants.find(variant => variant.parsers.every((parser, index) => parser === list[index]));
    if (!Object.isUndefined(found))
      return found.columns;

    const variant = new ParserVariant(list, columns.map((column, index) => {
      const parser = list[index] ?? null;
      return parser === column.parser ? column : column.withParser(parser);
    }));
    if (variants.length === RowReader.variety)
      variants.shift();
    variants.push(variant);
    return variant.columns;
  }

  public static read(data: Buffer, start: number, columns: readonly Column[], mode: RowMode, from: ((value: unknown, column: Column) => unknown) | null): unknown {
    const values: unknown[] = [];
    let at = start + 7;
    for (const column of columns) {
      const length = data.readInt32BE(at);
      at += 4;
      let value: unknown = null;
      if (length !== -1) {
        value = RowReader.readValue(data, at, at + length, column, mode);
        at += length;
      }
      if (!Object.isNull(from))
        value = from(value, column);
      values.push(value);
    }

    if (mode !== RowMode.Object)
      return values;

    const row: Record<string, unknown> = {};
    columns.forEach((column, index) => {
      const value = values[index];
      if (column.name === Resources.prototypeKey)
        Object.defineProperty(row, column.name, { value, writable: true, enumerable: true, configurable: true });
      else
        row[column.name] = value;
    });
    return row;
  }

  private static readValue(data: Buffer, start: number, end: number, column: Column, mode: RowMode): unknown {
    if (mode === RowMode.Raw)
      return Buffer.from(data.subarray(start, end));
    if (!Object.isNull(column.decode))
      return column.decode(data, start, end);

    const text = Backend.readText(data, start, end);
    return Object.isNull(column.parser) ? text : column.parser(text);
  }

  private static findColumnParser(column: Column, parsers: ((column: Column) => ValueParser | null) | ReadonlyMap<number, ValueParser | null>): ValueParser | null {
    if (Object.isFunction(parsers))
      return parsers(column);

    return parsers.has(column.type) ? parsers.get(column.type) ?? null : column.parser;
  }
}
