/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Column, ForeignKey, PrimaryKey, type SqlDialect, SqlQuery, type SqlTransaction, Table, type TableChangeOperation } from "@noldova/context.data.sql";

import { Resources } from "../resources.js";

export class SQLiteTableRebuild {
  public static async runAsync(dialect: SqlDialect, operation: TableChangeOperation, transaction: SqlTransaction): Promise<void> {
    const table = await SQLiteTableRebuild.readTableAsync(operation.table, transaction);
    const indexes = await transaction.queryAsync(new SqlQuery(Resources.selectIndexes, [operation.table]));
    const changed = operation.applyTo(table);
    const temporary = Resources.rebuildTablePrefix + table.name;
    const copied = changed.columns.filter(t => table.columns.some(c => c.name === t.name));
    const values = copied.map(t => t.isNullable || Object.isNull(t.defaultValueSql)
      ? dialect.quoteIdentifier(t.name)
      : Resources.formatCoalesce(dialect.quoteIdentifier(t.name), t.defaultValueSql));
    const statements = [
      dialect.renderCreateTable(changed, temporary),
      Resources.formatCopyRows(dialect.quoteIdentifier(temporary), copied.map(t => dialect.quoteIdentifier(t.name)).join(Resources.listSeparator),
        values.join(Resources.listSeparator), dialect.quoteIdentifier(table.name)),
      dialect.renderDropTable(table.name),
      Resources.formatRenameTable(dialect.quoteIdentifier(temporary), dialect.quoteIdentifier(table.name))
    ];
    for (const index of indexes) {
      const columns = await transaction.queryAsync(new SqlQuery(Resources.selectIndexColumns, [index.readString(Resources.nameField)]));
      if (columns.every(t => changed.columns.some(c => c.name === t.readString(Resources.nameField))))
        statements.push(index.readString(Resources.sqlField));
    }

    for (const statement of statements)
      await transaction.executeAsync(new SqlQuery(statement));
  }

  private static async readTableAsync(name: string, transaction: SqlTransaction): Promise<Table> {
    const rows = await transaction.queryAsync(new SqlQuery(Resources.selectColumns, [name]));
    const columns = rows.map(t => new Column(t.readString(Resources.nameField), t.readString(Resources.typeField), t.readInteger(Resources.notNullField) === 0,
      SQLiteTableRebuild.expressionOf(t.readNullableString(Resources.defaultField))));
    const key = rows.filter(t => t.readInteger(Resources.keyField) > 0)
      .sort((left, right) => left.readInteger(Resources.keyField) - right.readInteger(Resources.keyField))
      .map(t => t.readString(Resources.nameField));
    const foreignKeys = (await transaction.queryAsync(new SqlQuery(Resources.selectForeignKeys, [name])))
      .map(t => new ForeignKey(t.readString(Resources.fromField), t.readString(Resources.tableField), t.readString(Resources.toField)));

    return new Table(name, columns, key.length === 0 ? null : new PrimaryKey(key), foreignKeys);
  }

  private static expressionOf(sql: string | null): string | null {
    return Object.isNull(sql) ? null : Resources.formatExpression(sql);
  }
}
