/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException, DataRecord, type DataValue } from "@noldova/context.data";

import type { Column } from "../models/column.js";
import { Resources } from "../resources.js";

export class ValueConverter {
  private static readonly bigint: number = 20;
  private static readonly numbers: ReadonlySet<number> = new Set([21, 23, 26, 700, 701]);

  public static readRecord(columns: readonly Column[], row: unknown): DataRecord {
    if (!Array.isArray(row))
      throw new DataException(Resources.unsupportedValue);

    return new DataRecord(new Map(columns.map((column, index) => [column.name, ValueConverter.read(column.type, row[index])])));
  }

  public static read(type: number, text: unknown): DataValue {
    if (Object.isNull(text))
      return null;
    if (!Object.isString(text))
      throw new DataException(Resources.unsupportedValue);
    if (ValueConverter.numbers.has(type))
      return Number(text);
    if (type !== ValueConverter.bigint)
      return text;

    const value = Number(text);
    if (!Number.isSafeInteger(value))
      throw new DataException(Resources.unsafeInteger);

    return value;
  }

  public static write(value: DataValue): string | null {
    return Object.isNull(value) || Object.isString(value) ? value : value.toString();
  }
}
