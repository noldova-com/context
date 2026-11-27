/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { DataException } from "./data.exception.js";

export class ColumnMappedTwiceException extends DataException {
  public readonly table: string;
  public readonly column: string;

  public constructor(table: string, column: string) {
    super(Resources.formatColumnMappedTwice(table, column));

    this.table = table;
    this.column = column;
  }
}
