/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";

import "@noldova/context.core";

import { BackendKey } from "../../models/backend-key.js";
import { CommandResult } from "../../models/command-result.js";
import { Notification } from "../../models/notification.js";
import { RowColumn } from "../../models/row-column.js";
import { Resources } from "../../resources.js";

export class Backend {
  private static readonly errorFields: ReadonlyMap<number, string> = new Map([
    [83, "severity_local"],
    [86, "severity"],
    [67, "code"],
    [77, "message"],
    [68, "detail"],
    [72, "hint"],
    [80, "position"],
    [112, "internal_position"],
    [113, "internal_query"],
    [87, "where"],
    [115, "schema_name"],
    [116, "table_name"],
    [99, "column_name"],
    [100, "data_type_name"],
    [110, "constraint_name"],
    [70, "file"],
    [76, "line"],
    [82, "routine"]
  ]);

  public static readText(data: Buffer, start: number, end: number): string {
    return data.toString("utf8", start, end);
  }

  public static readError(data: Buffer, start: number, end: number): ReadonlyMap<string, string> {
    const fields = new Map<string, string>();
    for (let index = start + 5; index < end - 1;) {
      const zero = data.indexOf(0, index + 1);
      const code = data.readUInt8(index);
      fields.set(Backend.errorFields.get(code) ?? String.fromCharCode(code), data.toString("utf8", index + 1, zero));
      index = zero + 1;
    }

    const local = fields.get(Resources.localSeverityField);
    if (!fields.has(Resources.severityField) && !Object.isUndefined(local))
      fields.set(Resources.severityField, local);
    return fields;
  }

  public static readRowDescription(data: Buffer, start: number): readonly RowColumn[] {
    const count = data.readUInt16BE(start + 5);
    const columns: RowColumn[] = [];
    for (let index = start + 7; columns.length < count;) {
      const zero = data.indexOf(0, index);
      columns.push(new RowColumn(Backend.readText(data, index, zero), data.readUInt32BE(zero + 7)));
      index = zero + 19;
    }

    return columns;
  }

  public static readColumns<T>(data: Buffer, start: number, make: (name: string, table: number, number: number, type: number) => T): T[] {
    const count = data.readUInt16BE(start + 5);
    const columns: T[] = [];
    for (let index = start + 7; columns.length < count;) {
      const zero = data.indexOf(0, index);
      columns.push(make(Backend.readText(data, index, zero), data.readUInt32BE(zero + 1), data.readUInt16BE(zero + 5), data.readUInt32BE(zero + 7)));
      index = zero + 19;
    }

    return columns;
  }

  public static readColumnTypes(data: Buffer, start: number): number[] {
    return Backend.readColumns(data, start, (_name, _table, _number, type) => type);
  }

  public static readParameterDescription(data: Buffer, start: number): number[] {
    const count = data.readUInt16BE(start + 5);
    const oids: number[] = [];
    for (let index = 0; index < count; index += 1)
      oids.push(data.readUInt32BE(start + 7 + index * 4));

    return oids;
  }

  public static readDataRow(data: Buffer, start: number): readonly (string | null)[] {
    const count = data.readUInt16BE(start + 5);
    const values: (string | null)[] = [];
    for (let index = start + 7; values.length < count;) {
      const length = data.readInt32BE(index);
      index += 4;
      if (length === -1)
        values.push(null);
      else {
        values.push(Backend.readText(data, index, index + length));
        index += length;
      }
    }

    return values;
  }

  public static readCommandComplete(data: Buffer, start: number, end: number): CommandResult {
    const first = start + 5;
    let last = end - 1;
    let count: number | null = null;
    while (true) {
      let space = last - 1;
      while (space >= first && Backend.isDigit(data.readUInt8(space)))
        space -= 1;
      if (space === last - 1 || space < first || data.readUInt8(space) !== 32)
        break;
      count ??= Number(Backend.readText(data, space + 1, last));
      last = space;
    }

    return new CommandResult(Backend.readText(data, first, last), count);
  }

  public static readReadyForQuery(data: Buffer, start: number): string {
    return String.fromCharCode(data.readUInt8(start + 5));
  }

  public static readParameterStatus(data: Buffer, start: number): readonly [string, string] {
    const zero = data.indexOf(0, start + 5);
    return [data.toString("utf8", start + 5, zero), data.toString("utf8", zero + 1, data.indexOf(0, zero + 1))];
  }

  public static readNotification(data: Buffer, start: number): Notification {
    const zero = data.indexOf(0, start + 9);
    return new Notification(data.readInt32BE(start + 5), data.toString("utf8", start + 9, zero), data.toString("utf8", zero + 1, data.indexOf(0, zero + 1)));
  }

  public static readBackendKeyData(data: Buffer, start: number): BackendKey {
    return new BackendKey(data.readInt32BE(start + 5), data.readInt32BE(start + 9));
  }

  public static readAuthenticationType(data: Buffer, start: number): number {
    return data.readInt32BE(start + 5);
  }

  private static isDigit(code: number): boolean {
    return code >= 48 && code <= 57;
  }
}
