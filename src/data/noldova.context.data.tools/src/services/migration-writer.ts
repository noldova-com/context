/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import {
  AddColumnOperation,
  AddForeignKeyOperation,
  AddPrimaryKeyOperation,
  AlterColumnOperation,
  type Column,
  CreateTableOperation,
  DropColumnOperation,
  DropForeignKeyOperation,
  DropPrimaryKeyOperation,
  type SchemaDifference,
  type Table
} from "@noldova/context.data.sql";

import { Resources } from "../resources.js";

export class MigrationWriter {
  public static write(className: string, id: string, differences: readonly SchemaDifference[]): string {
    const statements = differences.flatMap(t => MigrationWriter.statementOf(t));
    const body = statements.length === 0
      ? [Resources.applyEmpty]
      : [Resources.applyStart, ...statements.map(t => `${Resources.statementIndent}${t}`), Resources.blockEnd];

    return [
      Resources.migrationImport,
      "",
      Resources.formatMigrationClass(className),
      ...Resources.formatMigrationConstructor(JSON.stringify(id)),
      "",
      ...body,
      Resources.classEnd,
      ""
    ].join(Resources.lineBreak);
  }

  private static statementOf(difference: SchemaDifference): readonly string[] {
    if (difference instanceof CreateTableOperation)
      return MigrationWriter.createTableOf(difference.table);
    if (difference instanceof AddColumnOperation)
      return [MigrationWriter.columnOf(Resources.formatBuilderCall(Resources.addColumnMethod,
        MigrationWriter.argumentsOf([difference.table, difference.column.name, difference.column.type])), difference.column)];
    if (difference instanceof AlterColumnOperation)
      return [MigrationWriter.columnOf(Resources.formatBuilderCall(Resources.alterColumnMethod,
        MigrationWriter.argumentsOf([difference.table, difference.column.name, difference.column.type])), difference.column)];
    if (difference instanceof DropColumnOperation)
      return [MigrationWriter.callOf(Resources.dropColumnMethod, [difference.table, difference.column])];
    if (difference instanceof AddPrimaryKeyOperation)
      return [MigrationWriter.callOf(Resources.addPrimaryKeyMethod, [difference.table, ...difference.primaryKey.columns])];
    if (difference instanceof DropPrimaryKeyOperation)
      return [MigrationWriter.callOf(Resources.dropPrimaryKeyMethod, [difference.table])];
    if (difference instanceof AddForeignKeyOperation)
      return [MigrationWriter.callOf(Resources.addForeignKeyMethod, [difference.table, difference.foreignKey.column, difference.foreignKey.principalTable,
        difference.foreignKey.principalColumn])];
    if (difference instanceof DropForeignKeyOperation)
      return [MigrationWriter.callOf(Resources.dropForeignKeyMethod, [difference.table, difference.column])];

    return [MigrationWriter.callOf(Resources.dropTableMethod, [difference.table])];
  }

  private static createTableOf(table: Table): readonly string[] {
    const constraints = [
      ...Object.isNull(table.primaryKey) ? [] : [Resources.formatConstraintsCall(Resources.addPrimaryKeyMethod, MigrationWriter.argumentsOf(table.primaryKey.columns))],
      ...table.foreignKeys.map(t => Resources.formatConstraintsCall(Resources.addForeignKeyMethod,
        MigrationWriter.argumentsOf([t.column, t.principalTable, t.principalColumn])))
    ].map(t => `${Resources.statementIndent}${t}${Resources.statementEnd}`);
    const columns = table.columns.map(t => `${Resources.statementIndent}${MigrationWriter.columnOf(Resources.formatTableCall(Resources.addColumnMethod,
      MigrationWriter.argumentsOf([t.name, t.type])), t)}`);
    const callbacks = constraints.length === 0
      ? [Resources.tableCallbackStart, ...columns, Resources.callbacksEnd]
      : [Resources.tableCallbackStart, ...columns, Resources.callbackEnd, Resources.constraintsCallbackStart, ...constraints, Resources.callbacksEnd];

    return [Resources.formatCreateTableStart(JSON.stringify(table.name)), ...callbacks];
  }

  private static columnOf(call: string, column: Column): string {
    const nullable = column.isNullable ? Resources.nullableCall : "";
    const defaultValue = Object.isNull(column.defaultValueSql) ? "" : Resources.formatDefaultValueSqlCall(JSON.stringify(column.defaultValueSql));

    return `${call}${nullable}${defaultValue}${Resources.statementEnd}`;
  }

  private static callOf(method: string, values: readonly string[]): string {
    return `${Resources.formatBuilderCall(method, MigrationWriter.argumentsOf(values))}${Resources.statementEnd}`;
  }

  private static argumentsOf(values: readonly string[]): string {
    return values.map(t => JSON.stringify(t)).join(Resources.argumentSeparator);
  }
}
