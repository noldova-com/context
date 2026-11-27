/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SqlDialect } from "../../services/sql-dialect.js";
import type { Column } from "../schema/column.js";
import { SchemaOperation } from "./schema-operation.js";

export class AddColumnOperation extends SchemaOperation {
  public readonly table: string;
  public readonly column: Column;

  public constructor(table: string, column: Column) {
    super();

    this.table = table;
    this.column = column;
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderAddColumn(this.table, this.column);
  }
}
