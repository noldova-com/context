/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SqlDialect } from "../../services/sql-dialect.js";
import type { PrimaryKey } from "../schema/primary-key.js";
import { Table } from "../schema/table.js";
import { TableChangeOperation } from "./table-change-operation.js";

export class AddPrimaryKeyOperation extends TableChangeOperation {
  public readonly primaryKey: PrimaryKey;

  public constructor(table: string, primaryKey: PrimaryKey) {
    super(table);

    this.primaryKey = primaryKey;
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderAddPrimaryKey(this.table, this.primaryKey);
  }

  public override applyTo(table: Table): Table {
    return new Table(table.name, table.columns, this.primaryKey, table.foreignKeys);
  }
}
