/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { type Column, SqlDialect } from "@noldova/context.data.sql";

export class TestDialect extends SqlDialect {
  public override formatBeginTransaction(): string {
    return "BEGIN";
  }

  public override formatColumnType(type: PropertyType): string {
    return type === PropertyType.Integer ? "INTEGER" : "TEXT";
  }

  public override formatIdentityColumnType(): string {
    return "INTEGER PRIMARY KEY";
  }

  public override formatLock(resource: string): readonly string[] {
    return [`LOCK ${resource}`];
  }

  public override renderAlterColumn(table: string, column: Column): string {
    return `ALTER ${table}.${column.name} ${column.type}${column.isNullable ? " NULL" : ""}`;
  }
}
