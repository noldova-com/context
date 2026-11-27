/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { type Index, PropertyType } from "@noldova/context.data";

import type { SchemaOperation } from "../models/operations/schema-operation.js";
import type { Column } from "../models/schema/column.js";
import type { ForeignKey } from "../models/schema/foreign-key.js";
import type { PrimaryKey } from "../models/schema/primary-key.js";
import type { Table } from "../models/schema/table.js";
import { SqlQuery } from "../models/sql-query.js";
import type { SqlTransaction } from "../models/sql-transaction.js";
import { Resources } from "../resources.js";

export abstract class SqlDialect {
  public abstract formatBeginTransaction(): string;

  public abstract formatColumnType(type: PropertyType): string;

  public abstract formatIdentityColumnType(): string;

  public abstract formatLock(resource: string): readonly string[];

  public abstract renderAlterColumn(table: string, column: Column): string;

  public formatMigrationStart(): readonly string[] {
    return [];
  }

  public formatMigrationEnd(): readonly string[] {
    return [];
  }

  public formatForeignKeyCheck(): string | null {
    return null;
  }

  public formatDefaultValue(type: PropertyType): string {
    return type === PropertyType.Integer ? Resources.zeroInteger : Resources.emptyString;
  }

  public async applyAsync(operation: SchemaOperation, transaction: SqlTransaction): Promise<void> {
    await transaction.executeAsync(new SqlQuery(operation.render(this)));
  }

  public quoteIdentifier(name: string): string {
    return Resources.identifierQuote + name.replaceAll(Resources.identifierQuote, Resources.escapedIdentifierQuote) + Resources.identifierQuote;
  }

  public renderCreateTable(table: Table, name: string = table.name): string {
    const definitions = table.columns.map(t => this.renderColumn(t));
    if (!Object.isNull(table.primaryKey))
      definitions.push(this.renderPrimaryKey(table.name, table.primaryKey));
    for (const foreignKey of table.foreignKeys)
      definitions.push(this.renderForeignKey(table.name, foreignKey));

    return [Resources.createTable, this.quoteIdentifier(name), this.renderList(definitions)].join(Resources.wordSeparator);
  }

  public renderDropTable(table: string): string {
    return [Resources.dropTable, this.quoteIdentifier(table)].join(Resources.wordSeparator);
  }

  public renderCreateIndex(index: Index): string {
    const keyword = index.isUnique ? Resources.createUniqueIndex : Resources.createIndex;
    return [keyword, this.quoteIdentifier(index.name), Resources.onKeyword, this.quoteIdentifier(index.container), this.renderNames(index.fields)]
      .join(Resources.wordSeparator);
  }

  public renderColumn(column: Column): string {
    const parts = [this.quoteIdentifier(column.name), column.type];
    if (!column.isNullable)
      parts.push(Resources.notNullConstraint);
    if (!Object.isNull(column.defaultValueSql))
      parts.push(Resources.defaultKeyword, column.defaultValueSql);

    return parts.join(Resources.wordSeparator);
  }

  public renderAddColumn(table: string, column: Column): string {
    return [this.renderAlterTable(table), Resources.addColumn, this.renderColumn(column)].join(Resources.wordSeparator);
  }

  public renderDropColumn(table: string, column: string): string {
    return [this.renderAlterTable(table), Resources.dropColumn, this.quoteIdentifier(column)].join(Resources.wordSeparator);
  }

  public renderPrimaryKey(table: string, primaryKey: PrimaryKey): string {
    return [this.renderConstraintName(Resources.primaryKeyNamePrefix, table), Resources.primaryKeyConstraint, this.renderNames(primaryKey.columns)]
      .join(Resources.wordSeparator);
  }

  public renderAddPrimaryKey(table: string, primaryKey: PrimaryKey): string {
    return [this.renderAlterTable(table), Resources.addKeyword, this.renderPrimaryKey(table, primaryKey)].join(Resources.wordSeparator);
  }

  public renderDropPrimaryKey(table: string): string {
    return [this.renderAlterTable(table), Resources.dropConstraint, this.quoteConstraintName(Resources.primaryKeyNamePrefix, table)].join(Resources.wordSeparator);
  }

  public renderForeignKey(table: string, foreignKey: ForeignKey): string {
    const columns = this.renderNames([foreignKey.column]);
    const principalColumns = this.renderNames([foreignKey.principalColumn]);
    return [this.renderConstraintName(Resources.foreignKeyNamePrefix, table, foreignKey.column), Resources.foreignKeyConstraint, columns,
      Resources.referencesConstraint, this.quoteIdentifier(foreignKey.principalTable), principalColumns].join(Resources.wordSeparator);
  }

  public renderAddForeignKey(table: string, foreignKey: ForeignKey): string {
    return [this.renderAlterTable(table), Resources.addKeyword, this.renderForeignKey(table, foreignKey)].join(Resources.wordSeparator);
  }

  public renderDropForeignKey(table: string, column: string): string {
    return [this.renderAlterTable(table), Resources.dropConstraint, this.quoteConstraintName(Resources.foreignKeyNamePrefix, table, column)]
      .join(Resources.wordSeparator);
  }

  protected renderAlterTable(table: string): string {
    return [Resources.alterTable, this.quoteIdentifier(table)].join(Resources.wordSeparator);
  }

  private renderConstraintName(prefix: string, ...parts: readonly string[]): string {
    return [Resources.constraintKeyword, this.quoteConstraintName(prefix, ...parts)].join(Resources.wordSeparator);
  }

  private quoteConstraintName(prefix: string, ...parts: readonly string[]): string {
    return this.quoteIdentifier([prefix, ...parts].join(Resources.nameSeparator));
  }

  private renderNames(names: readonly string[]): string {
    return this.renderList(names.map(t => this.quoteIdentifier(t)));
  }

  private renderList(items: readonly string[]): string {
    return Resources.openParenthesis + items.join(Resources.listSeparator) + Resources.closeParenthesis;
  }
}
