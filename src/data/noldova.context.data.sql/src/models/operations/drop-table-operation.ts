/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SqlDialect } from "../../services/sql-dialect.js";
import { SchemaOperation } from "./schema-operation.js";

export class DropTableOperation extends SchemaOperation {
  public readonly table: string;

  public constructor(table: string) {
    super();

    this.table = table;
  }

  public override render(dialect: SqlDialect): string {
    return dialect.renderDropTable(this.table);
  }
}
