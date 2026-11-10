/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Column } from "./column.js";

export class StatementShape {
  public readonly params: readonly number[];
  public readonly columns: readonly Column[] | null;

  public constructor(params: readonly number[], columns: readonly Column[] | null) {
    this.params = params;
    this.columns = columns;
  }
}
