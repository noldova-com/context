/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DateParser } from "@noldova/context.data.sql.postgresql/services/types/date.parser.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DateParserTests {
  @TestMethod
  public parsesAZonedTimestampByHand(): void {
    const zoned = DateParser.parseTimestamptz("0099-01-02 03:04:05.5+02:30");
    const utc = DateParser.parseTimestamptz("0099-01-02 03:04:05.123456-00");

    Assert.isInstanceOf(zoned, Date);
    Assert.areEqual("0099-01-02T00:34:05.500Z", zoned.toISOString());
    Assert.isInstanceOf(utc, Date);
    Assert.areEqual("0099-01-02T03:04:05.123Z", utc.toISOString());
  }

  @TestMethod
  public parsesAPlainZonedTimestampNatively(): void {
    const date = DateParser.timestamptz("2024-01-02T03:04:05.000Z");

    Assert.isInstanceOf(date, Date);
    Assert.areEqual("2024-01-02T03:04:05.000Z", date.toISOString());
  }

  @TestMethod
  public returnsInfinities(): void {
    Assert.areEqual(Infinity, DateParser.parseTimestamptz("infinity"));
    Assert.areEqual(-Infinity, DateParser.parseTimestamptz("-infinity"));
    Assert.areEqual(Infinity, DateParser.date("infinity"));
    Assert.areEqual(-Infinity, DateParser.timestamp("-infinity"));
  }

  @TestMethod
  public returnsAnInvalidDateForUnknownText(): void {
    const zoned = DateParser.parseTimestamptz("-nope");
    const date = DateParser.parseDate("nope");
    const local = DateParser.parseTimestamp("nope");

    Assert.isInstanceOf(zoned, Date);
    Assert.isTrue(Number.isNaN(zoned.getTime()));
    Assert.isInstanceOf(date, Date);
    Assert.isTrue(Number.isNaN(date.getTime()));
    Assert.isInstanceOf(local, Date);
    Assert.isTrue(Number.isNaN(local.getTime()));
  }

  @TestMethod
  public parsesDatesInUtcIncludingBeforeChrist(): void {
    const date = DateParser.parseDate("2024-01-02");
    const old = DateParser.parseDate("2024-01-02 BC");

    Assert.isInstanceOf(date, Date);
    Assert.areEqual("2024-01-02T00:00:00.000Z", date.toISOString());
    Assert.isInstanceOf(old, Date);
    Assert.areEqual(-2023, old.getUTCFullYear());
  }

  @TestMethod
  public parsesTimestampsInLocalTime(): void {
    const date = DateParser.parseTimestamp("2024-01-02 03:04:05.006");
    const early = DateParser.parseTimestamp("0050-01-02 03:04:05");

    Assert.isInstanceOf(date, Date);
    Assert.areEqual(2024, date.getFullYear());
    Assert.areEqual(3, date.getHours());
    Assert.areEqual(6, date.getMilliseconds());
    Assert.isInstanceOf(early, Date);
    Assert.areEqual(50, early.getFullYear());
    Assert.areEqual(3, early.getHours());
  }

  @TestMethod
  public parsesZonedTimestampsTheNativeParserCannotRead(): void {
    const old = DateParser.parseTimestamptz("2024-01-02 03:04:05+00 BC");
    const seconds = DateParser.parseTimestamptz("2024-01-02 03:04:05+05:30:15");
    const minutes = DateParser.parseTimestamptz("2024-01-02 03:04:05+05:30");

    Assert.isInstanceOf(old, Date);
    Assert.areEqual(-2023, old.getUTCFullYear());
    Assert.areEqual(3, old.getUTCHours());
    Assert.isInstanceOf(seconds, Date);
    Assert.areEqual("2024-01-01T21:33:50.000Z", seconds.toISOString());
    Assert.isInstanceOf(minutes, Date);
    Assert.areEqual("2024-01-01T21:34:05.000Z", minutes.toISOString());
  }

  @TestMethod
  public refusesToSerializeAValueThatIsNoDate(): void {
    Assert.throws(() => DateParser.serialize(true), RangeError);
    Assert.throws(() => DateParser.serialize("not a date"), RangeError);
  }

  @TestMethod
  public serializesDatesNumbersTextAndInfinities(): void {
    Assert.areEqual("infinity", DateParser.serialize(Infinity));
    Assert.areEqual("-infinity", DateParser.serialize(-Infinity));
    Assert.areEqual("1970-01-01T00:00:00.000Z", DateParser.serialize(0));
    Assert.areEqual("2024-01-02T00:00:00.000Z", DateParser.serialize("2024-01-02T00:00:00Z"));
    Assert.areEqual("2024-01-02T00:00:00.000Z", DateParser.serialize(new Date(Date.UTC(2024, 0, 2))));
  }
}
