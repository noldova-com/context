/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable } from "@noldova/context.collections";

export class Countdown extends Enumerable<number> {
  public constructor(start: number) {
    super(() => Iterator.from([start, start - 1, start - 2]));
  }
}
