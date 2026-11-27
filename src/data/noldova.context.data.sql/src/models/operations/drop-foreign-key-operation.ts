/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SqlDialect } from "../../services/sql-dialect.js";
import { Table } from "../schema/table.js";
import { TableChangeOperation } from "./table-change-operation.js";

export class DropForeignKeyOperation extends TableChangeOperation {
  public readonly column: string;

  public constructor(table: string, column: string) {
    super(table);

    this.column = column;
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderDropForeignKey(this.table, this.column);
  }

  public override applyTo(table: Table): Table {
    return new Table(table.name, table.columns, table.primaryKey, table.foreignKeys.filter(t => t.column !== this.column));
  }
}
