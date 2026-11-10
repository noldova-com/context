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

import type { BinaryDecoder } from "../../types/binary-decoder.js";
import { DateParser } from "./date.parser.js";

class BinaryArrayReader {
  private readonly data: Buffer;
  private readonly read: (data: Buffer, at: number) => unknown;
  private readonly sizes: number[] = [];
  private at: number;

  public constructor(data: Buffer, start: number, read: (data: Buffer, at: number) => unknown) {
    this.data = data;
    this.read = read;
    const dimensions = data.readInt32BE(start);
    for (let dimension = 0; dimension < dimensions; dimension += 1)
      this.sizes.push(data.readInt32BE(start + 12 + dimension * 8));
    this.at = start + 12 + dimensions * 8;
  }

  public readValues(): unknown[] {
    const read = this.sizes.reduceRight<(() => unknown[]) | null>((inner, count) => this.createReader(count, inner), null);
    return Object.isNull(read) ? [] : read();
  }

  private createReader(count: number, inner: (() => unknown[]) | null): () => unknown[] {
    return Object.isNull(inner) ? () => this.readElements(count) : () => Array.from({ length: count }, () => inner());
  }

  private readElements(count: number): unknown[] {
    const values: unknown[] = [];
    for (let index = 0; index < count; index += 1) {
      const length = this.data.readInt32BE(this.at);
      this.at += 4;
      if (length === -1)
        values.push(null);
      else {
        values.push(this.read(this.data, this.at));
        this.at += length;
      }
    }

    return values;
  }
}

export class BinaryReaders {
  public static readonly bytes: BinaryDecoder = (data: Buffer, start: number, end: number): Buffer => Buffer.from(data.subarray(start, end));
  public static readonly integer: BinaryDecoder = (data: Buffer, start: number, end: number): number => BinaryReaders.readInteger(data, start, end);
  public static readonly boolean: BinaryDecoder = (data: Buffer, start: number): boolean => BinaryReaders.readByte(data, start) === 116;
  public static readonly timestamptz: BinaryDecoder = (data: Buffer, start: number, end: number): Date | number => BinaryReaders.readTimestamptz(data, start, end);
  public static readonly utcStamp: BinaryDecoder = (data: Buffer, start: number, end: number): Date | number => BinaryReaders.readUtcStamp(data, start, end);
  public static readonly arrays: ReadonlyMap<number, BinaryDecoder> = new Map([
    [16, BinaryReaders.createArrayDecoder((data, at) => BinaryReaders.readByte(data, at) === 1)],
    [21, BinaryReaders.createArrayDecoder((data, at) => data.readInt16BE(at))],
    [23, BinaryReaders.createArrayDecoder((data, at) => data.readInt32BE(at))],
    [20, BinaryReaders.createArrayDecoder((data, at) => data.readBigInt64BE(at).toString())]
  ]);

  public static readClock(data: Buffer, start: number, end: number, zoned: boolean): number {
    const year = BinaryReaders.readDigits(data, start, 4);
    if (year < 1000 || BinaryReaders.readByte(data, start + 4) !== 45 || BinaryReaders.readByte(data, start + 7) !== 45)
      return Number.NaN;

    const month = BinaryReaders.readDigits(data, start + 5, 2);
    const day = BinaryReaders.readDigits(data, start + 8, 2);
    if (end - start === 10)
      return zoned || month < 1 || day < 1 ? Number.NaN : Date.UTC(year, month - 1, day);

    if (BinaryReaders.readByte(data, start + 10) !== 32 || BinaryReaders.readByte(data, start + 13) !== 58 || BinaryReaders.readByte(data, start + 16) !== 58)
      return Number.NaN;

    const hour = BinaryReaders.readDigits(data, start + 11, 2);
    const minute = BinaryReaders.readDigits(data, start + 14, 2);
    const second = BinaryReaders.readDigits(data, start + 17, 2);
    let at = start + 19;
    let milliseconds = 0;
    if (BinaryReaders.readByte(data, at) === 46) {
      let scale = 100;
      for (at += 1; at < end && BinaryReaders.isDigit(BinaryReaders.readByte(data, at)); at += 1) {
        milliseconds += (BinaryReaders.readByte(data, at) - 48) * scale;
        scale = scale / 10 | 0;
      }
    }

    let offset = 0;
    if (zoned) {
      const sign = BinaryReaders.readByte(data, at);
      const left = end - at;
      if ((sign !== 43 && sign !== 45) || (left !== 3 && (left !== 6 || BinaryReaders.readByte(data, at + 3) !== 58)))
        return Number.NaN;

      const hours = BinaryReaders.readDigits(data, at + 1, 2);
      const minutes = left === 6 ? BinaryReaders.readDigits(data, at + 4, 2) : 0;
      offset = hours * 60 + minutes;
      if (offset < 0 || hours < 0 || minutes < 0)
        return Number.NaN;

      if (sign === 45)
        offset = -offset;
      at = end;
    }

    if (at !== end || month < 1 || day < 1 || hour < 0 || minute < 0 || second < 0)
      return Number.NaN;

    return Date.UTC(year, month - 1, day, hour, minute, second, milliseconds) - offset * 60000;
  }

  private static createArrayDecoder(read: (data: Buffer, at: number) => unknown): BinaryDecoder {
    return (data: Buffer, start: number): unknown[] => new BinaryArrayReader(data, start, read).readValues();
  }

  private static readInteger(data: Buffer, start: number, end: number): number {
    const negative = BinaryReaders.readByte(data, start) === 45;
    let value = 0;
    for (let index = negative ? start + 1 : start; index < end; index += 1)
      value = value * 10 + BinaryReaders.readByte(data, index) - 48;

    return negative ? -value : value;
  }

  private static readTimestamptz(data: Buffer, start: number, end: number): Date | number {
    const time = BinaryReaders.readClock(data, start, end, true);
    return Number.isNaN(time) ? DateParser.parseTimestamptz(data.toString("latin1", start, end)) : new Date(time);
  }

  private static readUtcStamp(data: Buffer, start: number, end: number): Date | number {
    const time = BinaryReaders.readClock(data, start, end, false);
    return Number.isNaN(time) ? DateParser.parseDate(data.toString("latin1", start, end)) : new Date(time);
  }

  private static readDigits(data: Buffer, start: number, count: number): number {
    let value = 0;
    for (let index = start; index < start + count; index += 1) {
      const digit = BinaryReaders.readByte(data, index) - 48;
      if (digit < 0 || digit > 9)
        return -1;
      value = value * 10 + digit;
    }

    return value;
  }

  private static isDigit(code: number): boolean {
    return code >= 48 && code <= 57;
  }

  private static readByte(data: Buffer, index: number): number {
    return data[index] ?? -1;
  }
}
