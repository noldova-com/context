/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { PropertyType } from "@noldova/context.data";
import { type Column, SqlDialect } from "@noldova/context.data.sql";

import { Resources } from "../resources.js";

export class PostgreSQLDialect extends SqlDialect {
  public override formatBeginTransaction(): string {
    return Resources.beginTransaction;
  }

  public override formatColumnType(type: PropertyType): string {
    return type === PropertyType.Integer ? Resources.integerType : Resources.textType;
  }

  public override formatIdentityColumnType(): string {
    return Resources.identityColumnType;
  }

  public override formatLock(resource: string): readonly string[] {
    return [Resources.formatAdvisoryLock(resource.replaceAll(Resources.stringQuote, Resources.escapedStringQuote))];
  }

  public override renderAlterColumn(table: string, column: Column): string {
    const name = this.quoteIdentifier(column.name);
    const value = Resources.formatCast(name, column.type);
    const filled = column.isNullable || Object.isNull(column.defaultValueSql) ? value : Resources.formatCoalesce(value, column.defaultValueSql);

    return Resources.formatAlterColumn(this.renderAlterTable(table), name, column.type, filled, column.defaultValueSql,
      column.isNullable ? Resources.dropNotNull : Resources.setNotNull);
  }
}
