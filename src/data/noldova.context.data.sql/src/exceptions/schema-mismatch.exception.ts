/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

export class SchemaMismatchException extends DataException {
  public readonly table: string;
  public readonly column: string | null;

  public constructor(message: string, table: string, column: string | null) {
    super(message);

    this.table = table;
    this.column = column;
  }
}
