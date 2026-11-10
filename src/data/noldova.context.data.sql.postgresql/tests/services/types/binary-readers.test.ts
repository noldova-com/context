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
import { BinaryReaders } from "@noldova/context.data.sql.postgresql/services/types/binary-readers.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class BinaryReadersTests {
  @TestMethod
  public readsBytesIntegersAndBooleans(): void {
    const bytes = Buffer.from("xabcx");

    Assert.areEqual("abc", String(BinaryReaders.bytes(bytes, 1, 4)));
    Assert.areEqual(-123, BinaryReaders.integer(Buffer.from("-123"), 0, 4));
    Assert.areEqual(45, BinaryReaders.integer(Buffer.from("45"), 0, 2));
    Assert.areEqual(true, BinaryReaders.boolean(Buffer.from("t"), 0, 1));
    Assert.areEqual(false, BinaryReaders.boolean(Buffer.from("f"), 0, 1));
  }

  @TestMethod
  public readsADateOnlyWithoutAZone(): void {
    const text = Buffer.from("2024-01-02");

    Assert.areEqual(Date.UTC(2024, 0, 2), BinaryReaders.readClock(text, 0, 10, false));
    Assert.isTrue(Number.isNaN(BinaryReaders.readClock(text, 0, 10, true)));
    Assert.isTrue(Number.isNaN(BinaryReaders.readClock(Buffer.from("2024-00-02"), 0, 10, false)));
  }

  @TestMethod
  public readsZonedTimes(): void {
    const hours = Buffer.from("2024-01-02 03:04:05.123+02");
    const minutes = Buffer.from("2024-01-02 03:04:05-05:30");

    Assert.areEqual(Date.UTC(2024, 0, 2, 1, 4, 5, 123), BinaryReaders.readClock(hours, 0, hours.length, true));
    Assert.areEqual(Date.UTC(2024, 0, 2, 8, 34, 5), BinaryReaders.readClock(minutes, 0, minutes.length, true));
  }

  @TestMethod
  public refusesMalformedClocks(): void {
    for (const text of ["abcd-01-02", "2024/01/02", "2024-01-02T03:04:05", "2024-01-02 03:04:05x", "2024-01-02 03:04:05+2", "2024-01-02 03:04:05+0a",
      "2024-01-02 03:04:05+02;00", "2024-01-02 0a:04:05"]) {
      const data = Buffer.from(text);
      Assert.isTrue(Number.isNaN(BinaryReaders.readClock(data, 0, data.length, text.includes("+"))), text);
    }
    const local = Buffer.from("2024-01-02 03:04:05+02");
    Assert.isTrue(Number.isNaN(BinaryReaders.readClock(local, 0, local.length, false)));
  }

  @TestMethod
  public fallsBackToTheTextParsers(): void {
    const zoned = BinaryReaders.timestamptz(Buffer.from("2024-01-02 03:04:05+00"), 0, 22);
    const utc = BinaryReaders.utcStamp(Buffer.from("2024-01-02 03:04:05"), 0, 19);

    Assert.isInstanceOf(zoned, Date);
    Assert.areEqual("2024-01-02T03:04:05.000Z", zoned.toISOString());
    Assert.isInstanceOf(utc, Date);
    Assert.areEqual("2024-01-02T03:04:05.000Z", utc.toISOString());
    Assert.areEqual(Infinity, BinaryReaders.timestamptz(Buffer.from("infinity"), 0, 8));
    Assert.areEqual(-Infinity, BinaryReaders.utcStamp(Buffer.from("-infinity"), 0, 9));
  }

  @TestMethod
  public readsBinaryArrays(): void {
    const integers = BinaryReadersTests.array(23, [2], [BinaryReadersTests.int32(7), null]);
    const shorts = BinaryReadersTests.array(21, [2, 1], [BinaryReadersTests.int16(1), BinaryReadersTests.int16(2)]);
    const booleans = BinaryReadersTests.array(16, [1], [Buffer.from([1])]);
    const bigints = BinaryReadersTests.array(20, [1], [BinaryReadersTests.int64(9007199254740993n)]);

    Assert.areEqual("[7,null]", JSON.stringify(BinaryReaders.arrays.get(23)?.(integers, 0, integers.length)));
    Assert.areEqual("[[1],[2]]", JSON.stringify(BinaryReaders.arrays.get(21)?.(shorts, 0, shorts.length)));
    Assert.areEqual("[true]", JSON.stringify(BinaryReaders.arrays.get(16)?.(booleans, 0, booleans.length)));
    Assert.areEqual("[\"9007199254740993\"]", JSON.stringify(BinaryReaders.arrays.get(20)?.(bigints, 0, bigints.length)));
    Assert.areEqual("[]", JSON.stringify(BinaryReaders.arrays.get(23)?.(BinaryReadersTests.array(23, [], []), 0, 12)));
  }

  private static array(type: number, sizes: readonly number[], values: readonly (Buffer | null)[]): Buffer {
    const head = Buffer.alloc(12 + sizes.length * 8);
    head.writeInt32BE(sizes.length, 0);
    head.writeInt32BE(type, 8);
    sizes.forEach((size, index) => {
      head.writeInt32BE(size, 12 + index * 8);
      head.writeInt32BE(1, 16 + index * 8);
    });
    const parts: Buffer[] = [head];
    for (const value of values) {
      parts.push(BinaryReadersTests.int32(Object.isNull(value) ? -1 : value.length));
      if (!Object.isNull(value))
        parts.push(value);
    }

    return Buffer.concat(parts);
  }

  private static int16(value: number): Buffer {
    const data = Buffer.alloc(2);
    data.writeInt16BE(value, 0);
    return data;
  }

  private static int32(value: number): Buffer {
    const data = Buffer.alloc(4);
    data.writeInt32BE(value, 0);
    return data;
  }

  private static int64(value: bigint): Buffer {
    const data = Buffer.alloc(8);
    data.writeBigInt64BE(value, 0);
    return data;
  }
}
