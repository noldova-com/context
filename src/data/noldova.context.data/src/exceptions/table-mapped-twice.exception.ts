/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { DataException } from "./data.exception.js";

export class TableMappedTwiceException extends DataException {
  public readonly table: string;

  public constructor(table: string) {
    super(Resources.formatTableMappedTwice(table));

    this.table = table;
  }
}
