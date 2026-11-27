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
import { Column } from "../schema/column.js";
import { Table } from "../schema/table.js";
import { TableChangeOperation } from "./table-change-operation.js";

export class AlterColumnOperation extends TableChangeOperation {
  public readonly column: Column;

  public constructor(table: string, column: Column) {
    super(table);

    this.column = column;
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderAlterColumn(this.table, this.column);
  }

  public override applyTo(table: Table): Table {
    const existing = table.columns.find(t => t.name === this.column.name);
    if (Object.isUndefined(existing))
      throw new InvalidOperationException(Resources.formatColumnMissing(table.name, this.column.name));

    const altered = new Column(this.column.name, this.column.type, this.column.isNullable, this.column.defaultValueSql ?? existing.defaultValueSql);

    return new Table(table.name, table.columns.map(t => t === existing ? altered : t), table.primaryKey, table.foreignKeys);
  }
}
