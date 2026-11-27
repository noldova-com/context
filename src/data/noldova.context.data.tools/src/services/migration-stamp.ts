/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export class MigrationStamp {
  public static next(now: Date, last: string | null): string {
    const after = Object.isNull(last) ? now : new Date(Math.max(now.getTime(), MigrationStamp.parse(last).getTime() + 1000));

    return [
      after.getUTCFullYear(),
      after.getUTCMonth() + 1,
      after.getUTCDate(),
      after.getUTCHours(),
      after.getUTCMinutes(),
      after.getUTCSeconds()
    ].map((t, index) => String(t).padStart(index === 0 ? 4 : 2, "0")).join("");
  }

  private static parse(stamp: string): Date {
    const part = (start: number, length: number): number => Number(stamp.substring(start, start + length));

    return new Date(Date.UTC(part(0, 4), part(4, 2) - 1, part(6, 2), part(8, 2), part(10, 2), part(12, 2)));
  }
}
