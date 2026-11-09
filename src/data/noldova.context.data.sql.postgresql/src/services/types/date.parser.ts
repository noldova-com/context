/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { DateParts } from "../../models/date-parts.js";
import { Resources } from "../../resources.js";
import type { ValueParser } from "../../types/value-parser.js";

export class DateParser {
  private static readonly timestampPattern: RegExp =
    /^(\d{4,})-(\d\d)-(\d\d)(?: (\d\d):(\d\d):(\d\d)(?:\.(\d+))?)?(?:([+-])(\d\d)(?::(\d\d))?(?::(\d\d))?)?( BC)?$/;

  public static readonly timestamptz: ValueParser = (text: string): Date | number => DateParser.parseTimestamptz(text);
  public static readonly date: ValueParser = (text: string): Date | number => DateParser.parseDate(text);
  public static readonly timestamp: ValueParser = (text: string): Date | number => DateParser.parseTimestamp(text);

  public static parseTimestamptz(text: string): Date | number {
    if (DateParser.isPlain(text))
      return new Date(text);

    const infinite = DateParser.parseInfinite(text);
    if (!Object.isNull(infinite))
      return infinite;

    const parts = DateParser.parseParts(text);
    if (Object.isNull(parts))
      return new Date(text);

    const date = DateParser.toUtcDate(parts);
    date.setTime(date.getTime() - parts.offset);
    return date;
  }

  public static parseDate(text: string): Date | number {
    const infinite = DateParser.parseInfinite(text);
    if (!Object.isNull(infinite))
      return infinite;

    const parts = DateParser.parseParts(text);
    return Object.isNull(parts) ? new Date(text) : DateParser.toUtcDate(parts);
  }

  public static parseTimestamp(text: string): Date | number {
    const infinite = DateParser.parseInfinite(text);
    if (!Object.isNull(infinite))
      return infinite;

    const parts = DateParser.parseParts(text);
    if (Object.isNull(parts))
      return new Date(text);

    if (parts.year >= 100)
      return new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second, parts.milliseconds);

    const date = new Date(2000, 0, 1);
    date.setFullYear(parts.year, parts.month, parts.day);
    date.setHours(parts.hour, parts.minute, parts.second, parts.milliseconds);
    return date;
  }

  public static serialize(value: unknown): string {
    if (value === Infinity)
      return Resources.infinity;
    if (value === -Infinity)
      return Resources.negativeInfinity;

    const date = value instanceof Date ? value : new Date(Object.isNumber(value) || Object.isString(value) ? value : Number.NaN);
    return date.toISOString();
  }

  private static isPlain(text: string): boolean {
    const length = text.length;
    return text.charCodeAt(0) !== 48 && text.charCodeAt(length - 1) !== 67 && !(text.charCodeAt(length - 3) === 58 && text.charCodeAt(length - 6) === 58)
      && text.charCodeAt(0) !== 45 && text.charCodeAt(0) !== 105;
  }

  private static parseInfinite(text: string): number | null {
    if (text === Resources.infinity)
      return Infinity;

    return text === Resources.negativeInfinity ? -Infinity : null;
  }

  private static parseParts(text: string): DateParts | null {
    const match = DateParser.timestampPattern.exec(text);
    if (Object.isNull(match))
      return null;

    const group = (index: number): string => match[index] ?? "";
    const year = group(12).length > 0 ? 1 - Number(group(1)) : Number(group(1));
    const milliseconds = group(7).length > 0 ? Number(group(7).slice(0, 3)) * 10 ** (3 - Math.min(3, group(7).length)) : 0;
    const offset = group(8).length > 0
      ? (group(8) === Resources.minusSign ? -1 : 1) * ((Number(group(9)) * 60 + Number(group(10))) * 60 + Number(group(11))) * 1000
      : 0;

    return new DateParts(year, Number(group(2)) - 1, Number(group(3)), Number(group(4)), Number(group(5)), Number(group(6)), milliseconds, offset);
  }

  private static toUtcDate(parts: DateParts): Date {
    const date = new Date(Date.UTC(2000, parts.month, parts.day, parts.hour, parts.minute, parts.second, parts.milliseconds));
    date.setUTCFullYear(parts.year);
    return date;
  }
}
