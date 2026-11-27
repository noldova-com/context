/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { type Column, type SchemaOperation, SqlDialect, type SqlTransaction, TableChangeOperation } from "@noldova/context.data.sql";
import { InvalidOperationException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import { SQLiteTableRebuild } from "./sqlite-table-rebuild.js";

export class SQLiteDialect extends SqlDialect {
  public override formatBeginTransaction(): string {
    return Resources.beginTransaction;
  }

  public override formatColumnType(type: PropertyType): string {
    return type === PropertyType.Integer ? Resources.integerType : Resources.textType;
  }

  public override formatIdentityColumnType(): string {
    return Resources.identityColumnType;
  }

  public override formatLock(): readonly string[] {
    return [];
  }

  public override formatMigrationStart(): readonly string[] {
    return [Resources.foreignKeysOffPragma];
  }

  public override formatMigrationEnd(): readonly string[] {
    return [Resources.foreignKeysPragma];
  }

  public override formatForeignKeyCheck(): string {
    return Resources.selectForeignKeyViolation;
  }

  public override renderAlterColumn(table: string, column: Column): string {
    throw new InvalidOperationException(Resources.formatAlterColumnUnsupported(table, column.name));
  }

  public override async applyAsync(operation: SchemaOperation, transaction: SqlTransaction): Promise<void> {
    if (operation instanceof TableChangeOperation)
      await SQLiteTableRebuild.runAsync(this, operation, transaction);
    else
      await super.applyAsync(operation, transaction);
  }
}
