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

import { MalformedMessageException } from "../../exceptions/malformed-message.exception.js";
import { BackendKey } from "../../models/backend-key.js";
import { CommandResult } from "../../models/command-result.js";
import { Notification } from "../../models/notification.js";
import { ParameterStatus } from "../../models/parameter-status.js";
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
      if (zero === -1 || zero >= end)
        throw new MalformedMessageException();

      const code = data.readUInt8(index);
      fields.set(Backend.errorFields.get(code) ?? String.fromCharCode(code), data.toString("utf8", index + 1, zero));
      index = zero + 1;
    }

    const local = fields.get(Resources.localSeverityField);
    if (!fields.has(Resources.severityField) && !Object.isUndefined(local))
      fields.set(Resources.severityField, local);
    return fields;
  }

  public static readFieldCount(data: Buffer, start: number, end: number): number {
    Backend.checkWithin(start + 7, end);
    return data.readUInt16BE(start + 5);
  }

  public static readFieldLength(data: Buffer, at: number, end: number): number {
    Backend.checkWithin(at + 4, end);
    const length = data.readInt32BE(at);
    if (length < -1 || at + 4 + length > end)
      throw new MalformedMessageException();

    return length;
  }

  public static readColumns<T>(data: Buffer, start: number, end: number, make: (name: string, table: number, number: number, type: number) => T): T[] {
    const count = Backend.readFieldCount(data, start, end);
    const columns: T[] = [];
    for (let index = start + 7; columns.length < count;) {
      const zero = Backend.findTerminator(data, index, end);
      Backend.checkWithin(zero + 19, end);
      columns.push(make(Backend.readText(data, index, zero), data.readUInt32BE(zero + 1), data.readUInt16BE(zero + 5), data.readUInt32BE(zero + 7)));
      index = zero + 19;
    }

    return columns;
  }

  public static readColumnTypes(data: Buffer, start: number, end: number): number[] {
    return Backend.readColumns(data, start, end, (_name, _table, _number, type) => type);
  }

  public static readParameterDescription(data: Buffer, start: number, end: number): number[] {
    const count = Backend.readFieldCount(data, start, end);
    Backend.checkWithin(start + 7 + count * 4, end);
    const oids: number[] = [];
    for (let index = 0; index < count; index += 1)
      oids.push(data.readUInt32BE(start + 7 + index * 4));

    return oids;
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

  public static readReadyForQuery(data: Buffer, start: number, end: number): string {
    Backend.checkWithin(start + 6, end);
    return String.fromCharCode(data.readUInt8(start + 5));
  }

  public static readParameterStatus(data: Buffer, start: number, end: number): ParameterStatus {
    const zero = Backend.findTerminator(data, start + 5, end);
    return new ParameterStatus(data.toString("utf8", start + 5, zero), data.toString("utf8", zero + 1, Backend.findTerminator(data, zero + 1, end)));
  }

  public static readNotification(data: Buffer, start: number, end: number): Notification {
    Backend.checkWithin(start + 9, end);
    const zero = Backend.findTerminator(data, start + 9, end);
    return new Notification(data.readInt32BE(start + 5), data.toString("utf8", start + 9, zero), data.toString("utf8", zero + 1, Backend.findTerminator(data, zero + 1, end)));
  }

  public static readBackendKeyData(data: Buffer, start: number, end: number): BackendKey {
    Backend.checkWithin(start + 13, end);
    return new BackendKey(data.readInt32BE(start + 5), data.readInt32BE(start + 9));
  }

  public static readAuthenticationType(data: Buffer, start: number, end: number): number {
    Backend.checkWithin(start + 9, end);
    return data.readInt32BE(start + 5);
  }

  private static checkWithin(position: number, end: number): void {
    if (position > end)
      throw new MalformedMessageException();
  }

  private static findTerminator(data: Buffer, start: number, end: number): number {
    const zero = data.indexOf(0, start);
    if (zero === -1 || zero >= end)
      throw new MalformedMessageException();

    return zero;
  }

  private static isDigit(code: number): boolean {
    return code >= 48 && code <= 57;
  }
}
