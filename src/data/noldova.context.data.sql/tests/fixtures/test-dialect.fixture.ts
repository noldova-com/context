/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType, SqlDialect } from "@noldova/context.data.sql";

export class TestDialect extends SqlDialect {
  public override formatBeginTransaction(): string {
    return "BEGIN";
  }

  public override formatColumnType(type: ColumnType): string {
    return type === ColumnType.Integer ? "INTEGER" : "TEXT";
  }

  public override formatIdentityColumnType(): string {
    return "INTEGER PRIMARY KEY";
  }

  public override formatLock(resource: string): readonly string[] {
    return [`LOCK ${resource}`];
  }
}
