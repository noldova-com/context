/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType, SqlDialect } from "@noldova/context.data.sql";

import { Resources } from "../resources.js";

export class SQLiteDialect extends SqlDialect {
  public override formatBeginTransaction(): string {
    return Resources.beginTransaction;
  }

  public override formatColumnType(type: ColumnType): string {
    return type === ColumnType.Integer ? Resources.integerType : Resources.textType;
  }

  public override formatIdentityColumnType(): string {
    return Resources.identityColumnType;
  }

  public override formatLock(): readonly string[] {
    return [];
  }
}
