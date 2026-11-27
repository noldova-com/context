/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SqlDialect } from "../../services/sql-dialect.js";
import type { ForeignKey } from "../schema/foreign-key.js";
import { Table } from "../schema/table.js";
import { TableChangeOperation } from "./table-change-operation.js";

export class AddForeignKeyOperation extends TableChangeOperation {
  public readonly foreignKey: ForeignKey;

  public constructor(table: string, foreignKey: ForeignKey) {
    super(table);

    this.foreignKey = foreignKey;
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderAddForeignKey(this.table, this.foreignKey);
  }

  public override applyTo(table: Table): Table {
    return new Table(table.name, table.columns, table.primaryKey, [...table.foreignKeys, this.foreignKey]);
  }
}
