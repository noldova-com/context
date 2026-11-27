/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";

import type { SqlDialect } from "../../services/sql-dialect.js";
import { Resources } from "../../resources.js";
import { PrimaryKey } from "../schema/primary-key.js";
import { Table } from "../schema/table.js";
import { TableChangeOperation } from "./table-change-operation.js";

export class DropColumnOperation extends TableChangeOperation {
  public readonly column: string;

  public constructor(table: string, column: string) {
    super(table);

    this.column = column;
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderDropColumn(this.table, this.column);
  }

  public override applyTo(table: Table): Table {
    if (!table.columns.some(t => t.name === this.column))
      throw new InvalidOperationException(Resources.formatColumnMissing(table.name, this.column));

    const keyColumns = Object.isNull(table.primaryKey) ? [] : table.primaryKey.columns.filter(t => t !== this.column);

    return new Table(table.name, table.columns.filter(t => t.name !== this.column), keyColumns.length === 0 ? null : new PrimaryKey(keyColumns),
      table.foreignKeys.filter(t => t.column !== this.column));
  }
}
