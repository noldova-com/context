/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Column } from "./column.js";

export class BinaryColumns {
  public readonly columns: readonly Column[];
  public readonly formats: readonly number[];

  public constructor(columns: readonly Column[], formats: readonly number[]) {
    this.columns = columns;
    this.formats = formats;
  }
}
