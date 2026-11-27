/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary } from "@noldova/context.collections";
import { nameof } from "@noldova/context.core";
import { Index } from "@noldova/context.data";
import { InvalidOperationException } from "@noldova/context.exceptions";

import { AddColumnOperation } from "../operations/add-column-operation.js";
import { AddForeignKeyOperation } from "../operations/add-foreign-key-operation.js";
import { AddPrimaryKeyOperation } from "../operations/add-primary-key-operation.js";
import { AlterColumnOperation } from "../operations/alter-column-operation.js";
import { CreateIndexOperation } from "../operations/create-index-operation.js";
import { CreateTableOperation } from "../operations/create-table-operation.js";
import { DropColumnOperation } from "../operations/drop-column-operation.js";
import { DropForeignKeyOperation } from "../operations/drop-foreign-key-operation.js";
import { DropPrimaryKeyOperation } from "../operations/drop-primary-key-operation.js";
import { DropTableOperation } from "../operations/drop-table-operation.js";
import type { SchemaOperation } from "../operations/schema-operation.js";
import { SqlStatementOperation } from "../operations/sql-statement-operation.js";
import { ColumnBuilder } from "./column-builder.js";
import { ForeignKey } from "./foreign-key.js";
import { PrimaryKey } from "./primary-key.js";
import { Table } from "./table.js";
import { Resources } from "../../resources.js";
import type { ColumnSelector } from "../../types/column-selector.js";
import { ColumnsBuilder } from "./columns-builder.js";
import { ConstraintsBuilder } from "./constraints-builder.js";

export class MigrationBuilder {
  private static readonly ASCII_UPPERCASE: RegExp = /[A-Z]/g;
  private static readonly NAME_BYTE_LIMIT: number = 63;

  private readonly operations: (() => SchemaOperation)[] = [];
  private readonly indexNames: Dictionary<string, string> = new Dictionary();

  public createTable<TModel>(
    name: string,
    columns: (table: ColumnsBuilder<TModel>) => void,
    constraints?: (table: ConstraintsBuilder<TModel>) => void): void {
    const columnsBuilder = new ColumnsBuilder<TModel>();
    columns(columnsBuilder);
    const constraintsBuilder = new ConstraintsBuilder<TModel>();
    if (!Object.isUndefined(constraints))
      constraints(constraintsBuilder);
    this.add(new CreateTableOperation(new Table(name, columnsBuilder.toColumns(), constraintsBuilder.toPrimaryKey(), constraintsBuilder.toForeignKeys())));
  }

  public dropTable(name: string): void {
    this.add(new DropTableOperation(name));
  }

  public addColumn(table: string, name: string, type: string): ColumnBuilder {
    const column = new ColumnBuilder(name, type);
    this.operations.push(() => new AddColumnOperation(table, column.toColumn()));

    return column;
  }

  public alterColumn(table: string, name: string, type: string): ColumnBuilder {
    const column = new ColumnBuilder(name, type);
    this.operations.push(() => new AlterColumnOperation(table, column.toColumn()));

    return column;
  }

  public dropColumn(table: string, name: string): void {
    this.add(new DropColumnOperation(table, name));
  }

  public addPrimaryKey(table: string, ...columns: readonly string[]): void {
    this.add(new AddPrimaryKeyOperation(table, new PrimaryKey(columns)));
  }

  public dropPrimaryKey(table: string): void {
    this.add(new DropPrimaryKeyOperation(table));
  }

  public addForeignKey(table: string, column: string, principalTable: string, principalColumn: string): void {
    this.add(new AddForeignKeyOperation(table, new ForeignKey(column, principalTable, principalColumn)));
  }

  public dropForeignKey(table: string, column: string): void {
    this.add(new DropForeignKeyOperation(table, column));
  }

  public createIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void {
    this.addIndex(table, columns.map(t => nameof<TModel>(t)), false);
  }

  public createUniqueIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void {
    this.addIndex(table, columns.map(t => nameof<TModel>(t)), true);
  }

  public executeSql(statement: string): void {
    this.add(new SqlStatementOperation(statement));
  }

  public toOperations(): readonly SchemaOperation[] {
    return this.operations.map(t => t());
  }

  private add(operation: SchemaOperation): void {
    this.operations.push(() => operation);
  }

  private addIndex(table: string, columns: readonly string[], isUnique: boolean): void {
    const prefix = isUnique ? Resources.uniqueIndexNamePrefix : Resources.indexNamePrefix;
    const name = [prefix, table, ...columns].join(Resources.nameSeparator);
    const key = MigrationBuilder.nameKey(name);
    const existing = this.indexNames.tryGet(key);
    if (!Object.isUndefined(existing))
      throw new InvalidOperationException(Resources.formatIndexNameRepeated(name, existing));

    this.indexNames.set(key, name);
    this.add(new CreateIndexOperation(new Index(name, table, columns, isUnique)));
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
