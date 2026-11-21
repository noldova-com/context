/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEqualityComparer } from "@noldova/context.collections";

export class CaseInsensitiveComparer implements IEqualityComparer<string> {
  public equals(left: string, right: string): boolean {
    return left.toLowerCase() === right.toLowerCase();
  }

  public hash(value: string): number {
    return value.toLowerCase().length;
  }
}
