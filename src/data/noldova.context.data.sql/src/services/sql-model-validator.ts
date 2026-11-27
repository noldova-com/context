/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary } from "@noldova/context.collections";
import "@noldova/context.core";
import type { EntityProperty, EntityType, Model } from "@noldova/context.data";

import { SchemaMismatchException } from "../exceptions/schema-mismatch.exception.js";
import { CreateTableOperation } from "../models/operations/create-table-operation.js";
import { MigrationBuilder } from "../models/schema/migration-builder.js";
import type { Table } from "../models/schema/table.js";
import type { SqlMigration } from "../models/sql-migration.js";
import { Resources } from "../resources.js";
import type { SqlDialect } from "./sql-dialect.js";

export class SqlModelValidator {
  public static validate(model: Model, migrations: readonly SqlMigration[], dialect: SqlDialect): void {
    const tables = SqlModelValidator.replay(migrations);
    for (const entity of model.entityTypes) {
      const table = tables.tryGet(entity.tableName);
      if (Object.isUndefined(table))
        throw new SchemaMismatchException(Resources.formatTableMissing(entity.tableName), entity.tableName, null);

      for (const property of entity.properties)
        SqlModelValidator.validateColumn(table, property, dialect);
      SqlModelValidator.validatePrimaryKey(table, entity);
      for (const relation of entity.relations) {
        const principal = model.entityTypes.first(t => t.type === relation.principal);
        for (let index = 0; index < relation.foreignKey.count(); index++)
          SqlModelValidator.validateForeignKey(table, relation.foreignKey.get(index).columnName, principal.tableName, principal.key.get(index).columnName);
      }
    }
  }

  private static replay(migrations: readonly SqlMigration[]): Dictionary<string, Table> {
    const tables = new Dictionary<string, Table>();
    for (const migration of migrations) {
      const builder = new MigrationBuilder();
      migration.apply(builder);
      for (const operation of builder.toOperations())
        if (operation instanceof CreateTableOperation)
          tables.set(operation.table.name, operation.table);
    }

    return tables;
  }

  private static validateColumn(table: Table, property: EntityProperty, dialect: SqlDialect): void {
    const column = table.columns.find(t => t.name === property.columnName);
    if (Object.isUndefined(column))
      throw new SchemaMismatchException(Resources.formatColumnMissing(table.name, property.columnName), table.name, property.columnName);

    const expected = dialect.formatColumnType(property.type);
    if (column.type.toUpperCase() !== expected.toUpperCase())
      throw new SchemaMismatchException(Resources.formatColumnTypeMismatch(table.name, column.name, column.type, expected), table.name, column.name);
    if (column.isNullable && property.isRequired)
      throw new SchemaMismatchException(Resources.formatColumnNullable(table.name, column.name), table.name, column.name);
    if (!column.isNullable && !property.isRequired)
      throw new SchemaMismatchException(Resources.formatColumnNotNull(table.name, column.name), table.name, column.name);
  }

  private static validatePrimaryKey(table: Table, entity: EntityType): void {
    const columns = Object.isNull(table.primaryKey) ? "" : table.primaryKey.columns.join(Resources.listSeparator);
    const expected = String.join(Resources.listSeparator, entity.key.select(t => t.columnName));
    if (columns !== expected)
      throw new SchemaMismatchException(Resources.formatPrimaryKeyMismatch(table.name, columns, expected), table.name, null);
  }

  private static validateForeignKey(table: Table, column: string, principalTable: string, principalColumn: string): void {
    if (!table.foreignKeys.some(t => t.column === column && t.principalTable === principalTable && t.principalColumn === principalColumn))
      throw new SchemaMismatchException(Resources.formatForeignKeyMissing(table.name, column, principalTable, principalColumn), table.name, column);
  }
}
