/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class DateParts {
  public readonly year: number;
  public readonly month: number;
  public readonly day: number;
  public readonly hour: number;
  public readonly minute: number;
  public readonly second: number;
  public readonly milliseconds: number;
  public readonly offset: number;

  public constructor(year: number, month: number, day: number, hour: number, minute: number, second: number, milliseconds: number, offset: number) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.second = second;
    this.milliseconds = milliseconds;
    this.offset = offset;
  }
}
