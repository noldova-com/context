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

export class DropPrimaryKeyOperation extends TableChangeOperation {
  public constructor(table: string) {
    super(table);
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderDropPrimaryKey(this.table);
  }

  public override applyTo(table: Table): Table {
    return new Table(table.name, table.columns, null, table.foreignKeys);
  }
}
