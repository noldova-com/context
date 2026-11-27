/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Resources } from "../resources.js";

export class MigrationStamp {
  public static next(now: Date, last: string | null): string {
    const after = Object.isNull(last) ? now : new Date(Math.max(now.getTime(), MigrationStamp.parse(last).getTime() + Resources.stampStepMilliseconds));
    const parts = [after.getUTCMonth() + 1, after.getUTCDate(), after.getUTCHours(), after.getUTCMinutes(), after.getUTCSeconds()];

    return [
      String(after.getUTCFullYear()).padStart(Resources.stampYearLength, Resources.stampPad),
      ...parts.map(t => String(t).padStart(Resources.stampPartLength, Resources.stampPad))
    ].join("");
  }

  private static parse(stamp: string): Date {
    const year = Resources.stampYearLength;
    const length = Resources.stampPartLength;
    const part = (index: number): number => Number(stamp.substring(year + (index * length), year + ((index + 1) * length)));

    return new Date(Date.UTC(Number(stamp.substring(0, year)), part(0) - 1, part(1), part(2), part(3), part(4)));
  }
}
