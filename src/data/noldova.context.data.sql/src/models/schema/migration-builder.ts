/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { Index } from "@noldova/context.data";
import { InvalidOperationException } from "@noldova/context.exceptions";

import { CreateIndexOperation } from "../operations/create-index-operation.js";
import { CreateTableOperation } from "../operations/create-table-operation.js";
import type { SchemaOperation } from "../operations/schema-operation.js";
import { SqlStatementOperation } from "../operations/sql-statement-operation.js";
import { Table } from "./table.js";
import { Resources } from "../../resources.js";
import type { ColumnSelector } from "../../types/column-selector.js";
import { ColumnsBuilder } from "./columns-builder.js";
import { ConstraintsBuilder } from "./constraints-builder.js";

export class MigrationBuilder {
  private static readonly ASCII_UPPERCASE: RegExp = /[A-Z]/g;
  private static readonly NAME_BYTE_LIMIT: number = 63;

  private readonly operations: SchemaOperation[] = [];

  public createTable<TModel>(
    name: string,
    columns: (table: ColumnsBuilder<TModel>) => void,
    constraints?: (table: ConstraintsBuilder<TModel>) => void): void {
    const columnsBuilder = new ColumnsBuilder<TModel>();
    columns(columnsBuilder);
    const constraintsBuilder = new ConstraintsBuilder<TModel>();
    if (!Object.isUndefined(constraints))
      constraints(constraintsBuilder);
    const table = new Table(name, columnsBuilder.toColumns(), constraintsBuilder.toPrimaryKey(), constraintsBuilder.toForeignKeys());
    this.operations.push(new CreateTableOperation(table));
  }

  public createIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void {
    this.addIndex(table, columns.map(t => nameof<TModel>(t)), false);
  }

  public createUniqueIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void {
    this.addIndex(table, columns.map(t => nameof<TModel>(t)), true);
  }

  public executeSql(statement: string): void {
    this.operations.push(new SqlStatementOperation(statement));
  }

  public toOperations(): readonly SchemaOperation[] {
    return [...this.operations];
  }

  private addIndex(table: string, columns: readonly string[], isUnique: boolean): void {
    const prefix = isUnique ? Resources.uniqueIndexNamePrefix : Resources.indexNamePrefix;
    const name = [prefix, table, ...columns].join(Resources.nameSeparator);
    const key = MigrationBuilder.nameKey(name);
    for (const operation of this.operations)
      if (operation instanceof CreateIndexOperation && MigrationBuilder.nameKey(operation.index.name) === key)
        throw new InvalidOperationException(Resources.formatIndexNameRepeated(name, operation.index.name));

    this.operations.push(new CreateIndexOperation(new Index(name, table, columns, isUnique)));
  }

  private static nameKey(name: string): string {
    let key = "";
    let bytes = 0;
    for (const character of name.replace(MigrationBuilder.ASCII_UPPERCASE, t => t.toLowerCase())) {
      bytes += MigrationBuilder.utf8Length(character);
      if (bytes > MigrationBuilder.NAME_BYTE_LIMIT)
        break;

      key += character;
    }

    return key;
  }

  private static utf8Length(character: string): number {
    if (character.length > 1)
      return 4;

    const code = character.charCodeAt(0);
    return code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
  }
}
