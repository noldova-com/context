/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Index } from "@noldova/context.data";

import type { ColumnType } from "../enums/column-type.js";
import type { Column } from "../models/schema/column.js";
import type { ForeignKey } from "../models/schema/foreign-key.js";
import type { PrimaryKey } from "../models/schema/primary-key.js";
import type { Table } from "../models/schema/table.js";
import { Resources } from "../resources.js";

export abstract class SqlDialect {
  public abstract formatBeginTransaction(): string;

  public abstract formatColumnType(type: ColumnType): string;

  public abstract formatIdentityColumnType(): string;

  public abstract formatLock(resource: string): readonly string[];

  public quoteIdentifier(name: string): string {
    return Resources.identifierQuote + name.replaceAll(Resources.identifierQuote, Resources.escapedIdentifierQuote) + Resources.identifierQuote;
  }

  public renderCreateTable(table: Table): string {
    const definitions = table.columns.map(t => this.renderColumn(t));
    if (!Object.isNull(table.primaryKey))
      definitions.push(this.renderPrimaryKey(table.primaryKey));
    for (const foreignKey of table.foreignKeys)
      definitions.push(this.renderForeignKey(foreignKey));
    return [Resources.createTable, this.quoteIdentifier(table.name), this.renderList(definitions)].join(Resources.wordSeparator);
  }

  public renderCreateIndex(index: Index): string {
    const keyword = index.isUnique ? Resources.createUniqueIndex : Resources.createIndex;
    return [keyword, this.quoteIdentifier(index.name), Resources.onKeyword, this.quoteIdentifier(index.container), this.renderNames(index.fields)]
      .join(Resources.wordSeparator);
  }

  public renderColumn(column: Column): string {
    const parts = [this.quoteIdentifier(column.name), this.formatColumnType(column.type)];
    if (!column.isNullable)
      parts.push(Resources.notNullConstraint);
    return parts.join(Resources.wordSeparator);
  }

  public renderPrimaryKey(primaryKey: PrimaryKey): string {
    return [Resources.primaryKeyConstraint, this.renderNames(primaryKey.columns)].join(Resources.wordSeparator);
  }

  public renderForeignKey(foreignKey: ForeignKey): string {
    const columns = this.renderNames([foreignKey.column]);
    const principalColumns = this.renderNames([foreignKey.principalColumn]);
    return [Resources.foreignKeyConstraint, columns, Resources.referencesConstraint, this.quoteIdentifier(foreignKey.principalTable), principalColumns]
      .join(Resources.wordSeparator);
  }

  private renderNames(names: readonly string[]): string {
    return this.renderList(names.map(t => this.quoteIdentifier(t)));
  }

  private renderList(items: readonly string[]): string {
    return Resources.openParenthesis + items.join(Resources.listSeparator) + Resources.closeParenthesis;
  }
}
