/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Table } from "./table.js";

export class TablePair {
  public readonly source: Table;
  public readonly target: Table;

  public constructor(source: Table, target: Table) {
    this.source = source;
    this.target = target;
  }
}
